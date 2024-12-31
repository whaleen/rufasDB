export type Operators = {
    equals?: any;
    gt?: number;
    gte?: number;
    lt?: number;
    lte?: number;
    contains?: string;
    startsWith?: string;
    endsWith?: string;
    in?: any[];
    notIn?: any[];
};
export type WhereCondition<T> = {
    [K in keyof T]?: T[K] | Operators;
} & {
    OR?: WhereCondition<T>[];
    AND?: WhereCondition<T>[];
    NOT?: WhereCondition<T>;
};
export type QueryOptions<T> = {
    where?: WhereCondition<T>;
    take?: number;
    skip?: number;
    orderBy?: {
        [K in keyof T]?: 'asc' | 'desc';
    };
};
