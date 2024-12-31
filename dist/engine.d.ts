import type { QueryOptions } from './types';
export declare class RufasEngine<Schema extends Record<string, any>> {
    private dirHandle;
    private data;
    private isLocked;
    private lockTimeout;
    private operationQueue;
    private isProcessing;
    constructor(dirHandle: FileSystemDirectoryHandle, schema: Schema);
    private initializeSchema;
    private acquireLock;
    private releaseLock;
    private queueOperation;
    private processQueue;
    private read;
    private write;
    private isNumber;
    private isArray;
    private matchQuery;
    findMany<T extends keyof Schema>(model: T, options?: QueryOptions<Schema[T]>): Promise<Schema[T][]>;
    create<T extends keyof Schema>(model: T, data: Omit<Schema[T], 'id'>): Promise<Schema[T]>;
    update<T extends keyof Schema>(model: T, id: string, data: Partial<Schema[T]>): Promise<Schema[T]>;
    delete<T extends keyof Schema>(model: T, id: string): Promise<void>;
}
