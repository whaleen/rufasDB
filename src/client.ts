// src/client.ts
import { RufasEngine } from './engine'
import type { QueryOptions } from './types'

export class RufasClient<Schema extends Record<string, any>> {
  private engine: RufasEngine<Schema>

  constructor(dirHandle: FileSystemDirectoryHandle, schema: Schema) {
    this.engine = new RufasEngine<Schema>(dirHandle, schema)
  }

  model<T extends keyof Schema>(name: T) {
    return {
      findMany: (options?: QueryOptions<Schema[T]>) =>
        this.engine.findMany(name, options),

      create: (data: Omit<Schema[T], 'id'>) => this.engine.create(name, data),

      update: (id: string, data: Partial<Schema[T]>) =>
        this.engine.update(name, id, data),

      delete: (id: string) => this.engine.delete(name, id),
    }
  }
}
