import type { QueryOptions } from './types';
export declare class RufasClient<Schema extends Record<string, any>> {
    private engine;
    constructor(dirHandle: FileSystemDirectoryHandle, schema: Schema);
    model<T extends keyof Schema>(name: T): {
        findMany: (options?: QueryOptions<Schema[T]>) => Promise<Schema[T][]>;
        create: (data: Omit<Schema[T], "id">) => Promise<Schema[T]>;
        update: (id: string, data: Partial<Schema[T]>) => Promise<Schema[T]>;
        delete: (id: string) => Promise<void>;
    };
}
