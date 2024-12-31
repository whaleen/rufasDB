"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RufasEngine = void 0;
class RufasEngine {
    constructor(dirHandle, schema) {
        this.dirHandle = dirHandle;
        this.data = {};
        this.isLocked = false;
        this.lockTimeout = 5000;
        this.operationQueue = [];
        this.isProcessing = false;
        this.initializeSchema(schema);
    }
    initializeSchema(schema) {
        Object.keys(schema).forEach((model) => {
            this.data[model] = [];
        });
    }
    async acquireLock() {
        if (this.isLocked)
            throw new Error('Storage is locked');
        this.isLocked = true;
        setTimeout(() => (this.isLocked = false), this.lockTimeout);
    }
    releaseLock() {
        this.isLocked = false;
    }
    async queueOperation(operation) {
        return new Promise((resolve, reject) => {
            this.operationQueue.push(async () => {
                try {
                    const result = await operation();
                    resolve(result);
                }
                catch (error) {
                    reject(error);
                }
            });
            this.processQueue();
        });
    }
    async processQueue() {
        if (this.isProcessing || this.isLocked)
            return;
        this.isProcessing = true;
        while (this.operationQueue.length > 0) {
            await this.acquireLock();
            try {
                const operation = this.operationQueue.shift();
                await operation();
            }
            finally {
                this.releaseLock();
            }
        }
        this.isProcessing = false;
    }
    async read(model) {
        const dbHandle = await this.dirHandle.getDirectoryHandle('.rufasdb', {
            create: true,
        });
        const fileHandle = await dbHandle.getFileHandle(`${model}.json`, {
            create: true,
        });
        const file = await fileHandle.getFile();
        const content = await file.text();
        return content ? JSON.parse(content) : [];
    }
    async write(model, data) {
        const dbHandle = await this.dirHandle.getDirectoryHandle('.rufasdb', {
            create: true,
        });
        const fileHandle = await dbHandle.getFileHandle(`${model}.json`, {
            create: true,
        });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
    }
    isNumber(value) {
        return typeof value === 'number';
    }
    isArray(value) {
        return Array.isArray(value);
    }
    matchQuery(record, where) {
        for (const [key, condition] of Object.entries(where)) {
            if (key === 'OR') {
                return condition.some((orCondition) => this.matchQuery(record, orCondition));
            }
            if (key === 'AND') {
                return condition.every((andCondition) => this.matchQuery(record, andCondition));
            }
            if (key === 'NOT') {
                return !this.matchQuery(record, condition);
            }
            const value = record[key];
            if (typeof condition !== 'object') {
                return value === condition;
            }
            for (const [op, compareValue] of Object.entries(condition)) {
                switch (op) {
                    case 'equals':
                        if (value !== compareValue)
                            return false;
                        break;
                    case 'gt':
                        if (!this.isNumber(compareValue) || !(value > compareValue))
                            return false;
                        break;
                    case 'gte':
                        if (!this.isNumber(compareValue) || !(value >= compareValue))
                            return false;
                        break;
                    case 'lt':
                        if (!this.isNumber(compareValue) || !(value < compareValue))
                            return false;
                        break;
                    case 'lte':
                        if (!this.isNumber(compareValue) || !(value <= compareValue))
                            return false;
                        break;
                    case 'contains':
                        if (!String(value).includes(String(compareValue)))
                            return false;
                        break;
                    case 'startsWith':
                        if (!String(value).startsWith(String(compareValue)))
                            return false;
                        break;
                    case 'endsWith':
                        if (!String(value).endsWith(String(compareValue)))
                            return false;
                        break;
                    case 'in':
                        if (!this.isArray(compareValue) || !compareValue.includes(value))
                            return false;
                        break;
                    case 'notIn':
                        if (!this.isArray(compareValue) || compareValue.includes(value))
                            return false;
                        break;
                }
            }
        }
        return true;
    }
    async findMany(model, options) {
        return this.queueOperation(async () => {
            this.data[model] = await this.read(model);
            let results = this.data[model];
            if (options?.where) {
                results = results.filter((record) => this.matchQuery(record, options.where));
            }
            if (options?.orderBy) {
                const [sortField, direction] = Object.entries(options.orderBy)[0];
                results.sort((a, b) => direction === 'asc'
                    ? a[sortField] > b[sortField]
                        ? 1
                        : -1
                    : a[sortField] < b[sortField]
                        ? 1
                        : -1);
            }
            if (options?.skip)
                results = results.slice(options.skip);
            if (options?.take)
                results = results.slice(0, options.take);
            return results;
        });
    }
    async create(model, data) {
        return this.queueOperation(async () => {
            this.data[model] = await this.read(model);
            const newRecord = {
                ...data,
                id: crypto.randomUUID(),
            };
            this.data[model].push(newRecord);
            await this.write(model, this.data[model]);
            return newRecord;
        });
    }
    async update(model, id, data) {
        return this.queueOperation(async () => {
            this.data[model] = await this.read(model);
            const index = this.data[model].findIndex((r) => r.id === id);
            if (index === -1)
                throw new Error('Record not found');
            const updated = {
                ...this.data[model][index],
                ...data,
            };
            this.data[model][index] = updated;
            await this.write(model, this.data[model]);
            return updated;
        });
    }
    async delete(model, id) {
        return this.queueOperation(async () => {
            this.data[model] = await this.read(model);
            const index = this.data[model].findIndex((r) => r.id === id);
            if (index === -1)
                throw new Error('Record not found');
            this.data[model].splice(index, 1);
            await this.write(model, this.data[model]);
        });
    }
}
exports.RufasEngine = RufasEngine;
