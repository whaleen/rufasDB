// src/engine.ts
import type { WhereCondition, QueryOptions } from './types'

export class RufasEngine<Schema extends Record<string, any>> {
  private data: { [K in keyof Schema]: any[] } = {} as any
  private isLocked = false
  private lockTimeout = 5000
  private operationQueue: Array<() => Promise<void>> = []
  private isProcessing = false

  constructor(private dirHandle: FileSystemDirectoryHandle, schema: Schema) {
    this.initializeSchema(schema)
  }

  private initializeSchema(schema: Schema) {
    Object.keys(schema).forEach((model) => {
      this.data[model as keyof Schema] = []
    })
  }

  private async acquireLock(): Promise<void> {
    if (this.isLocked) throw new Error('Storage is locked')
    this.isLocked = true
    setTimeout(() => (this.isLocked = false), this.lockTimeout)
  }

  private releaseLock(): void {
    this.isLocked = false
  }

  private async queueOperation<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.operationQueue.push(async () => {
        try {
          const result = await operation()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      this.processQueue()
    })
  }

  private async processQueue() {
    if (this.isProcessing || this.isLocked) return
    this.isProcessing = true

    while (this.operationQueue.length > 0) {
      await this.acquireLock()
      try {
        const operation = this.operationQueue.shift()!
        await operation()
      } finally {
        this.releaseLock()
      }
    }

    this.isProcessing = false
  }

  private async read(model: string): Promise<any[]> {
    const dbHandle = await this.dirHandle.getDirectoryHandle('.rufasdb', {
      create: true,
    })
    const fileHandle = await dbHandle.getFileHandle(`${model}.json`, {
      create: true,
    })
    const file = await fileHandle.getFile()
    const content = await file.text()
    return content ? JSON.parse(content) : []
  }

  private async write(model: string, data: any[]): Promise<void> {
    const dbHandle = await this.dirHandle.getDirectoryHandle('.rufasdb', {
      create: true,
    })
    const fileHandle = await dbHandle.getFileHandle(`${model}.json`, {
      create: true,
    })
    const writable = await fileHandle.createWritable()
    await writable.write(JSON.stringify(data, null, 2))
    await writable.close()
  }

  private isNumber(value: unknown): value is number {
    return typeof value === 'number'
  }

  private isArray(value: unknown): value is any[] {
    return Array.isArray(value)
  }

  private matchQuery(record: any, where: WhereCondition<any>): boolean {
    for (const [key, condition] of Object.entries(where)) {
      if (key === 'OR') {
        return (condition as WhereCondition<any>[]).some((orCondition) =>
          this.matchQuery(record, orCondition)
        )
      }

      if (key === 'AND') {
        return (condition as WhereCondition<any>[]).every((andCondition) =>
          this.matchQuery(record, andCondition)
        )
      }

      if (key === 'NOT') {
        return !this.matchQuery(record, condition)
      }

      const value = record[key]
      if (typeof condition !== 'object') {
        return value === condition
      }

      for (const [op, compareValue] of Object.entries(condition)) {
        switch (op) {
          case 'equals':
            if (value !== compareValue) return false
            break
          case 'gt':
            if (!this.isNumber(compareValue) || !(value > compareValue))
              return false
            break
          case 'gte':
            if (!this.isNumber(compareValue) || !(value >= compareValue))
              return false
            break
          case 'lt':
            if (!this.isNumber(compareValue) || !(value < compareValue))
              return false
            break
          case 'lte':
            if (!this.isNumber(compareValue) || !(value <= compareValue))
              return false
            break
          case 'contains':
            if (!String(value).includes(String(compareValue))) return false
            break
          case 'startsWith':
            if (!String(value).startsWith(String(compareValue))) return false
            break
          case 'endsWith':
            if (!String(value).endsWith(String(compareValue))) return false
            break
          case 'in':
            if (!this.isArray(compareValue) || !compareValue.includes(value))
              return false
            break
          case 'notIn':
            if (!this.isArray(compareValue) || compareValue.includes(value))
              return false
            break
        }
      }
    }
    return true
  }

  async findMany<T extends keyof Schema>(
    model: T,
    options?: QueryOptions<Schema[T]>
  ): Promise<Schema[T][]> {
    return this.queueOperation(async () => {
      this.data[model] = await this.read(model as string)
      let results = this.data[model]

      if (options?.where) {
        results = results.filter((record) =>
          this.matchQuery(record, options.where!)
        )
      }

      if (options?.orderBy) {
        const [sortField, direction] = Object.entries(options.orderBy)[0]
        results.sort((a, b) =>
          direction === 'asc'
            ? a[sortField] > b[sortField]
              ? 1
              : -1
            : a[sortField] < b[sortField]
            ? 1
            : -1
        )
      }

      if (options?.skip) results = results.slice(options.skip)
      if (options?.take) results = results.slice(0, options.take)

      return results
    })
  }

  async create<T extends keyof Schema>(
    model: T,
    data: Omit<Schema[T], 'id'>
  ): Promise<Schema[T]> {
    return this.queueOperation(async () => {
      this.data[model] = await this.read(model as string)

      const newRecord = {
        ...data,
        id: crypto.randomUUID(),
      }

      this.data[model].push(newRecord)
      await this.write(model as string, this.data[model])

      return newRecord as Schema[T]
    })
  }

  async update<T extends keyof Schema>(
    model: T,
    id: string,
    data: Partial<Schema[T]>
  ): Promise<Schema[T]> {
    return this.queueOperation(async () => {
      this.data[model] = await this.read(model as string)

      const index = this.data[model].findIndex((r: any) => r.id === id)
      if (index === -1) throw new Error('Record not found')

      const updated = {
        ...this.data[model][index],
        ...data,
      }

      this.data[model][index] = updated
      await this.write(model as string, this.data[model])

      return updated as Schema[T]
    })
  }

  async delete<T extends keyof Schema>(model: T, id: string): Promise<void> {
    return this.queueOperation(async () => {
      this.data[model] = await this.read(model as string)

      const index = this.data[model].findIndex((r: any) => r.id === id)
      if (index === -1) throw new Error('Record not found')

      this.data[model].splice(index, 1)
      await this.write(model as string, this.data[model])
    })
  }
}
