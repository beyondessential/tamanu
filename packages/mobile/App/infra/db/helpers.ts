/** @see https://www.sqlite.org/limits.html#max_variable_number */
export const SQLITE_MAX_PARAMETERS = 32766;
/** @see https://www.sqlite.org/limits.html#max_expr_depth */
export const SQLITE_MAX_DEPTH_OF_EXPRESSION_TREE = 1000;

export const MAX_BATCH_SIZE_FOR_BULK_INSERT = SQLITE_MAX_DEPTH_OF_EXPRESSION_TREE - 3;
export const INSERT_CHUNK_SIZE = 500; // Should be config and just limit at 997

export const formatDateForQuery = (date: Date): number => date.valueOf() / 1000;
