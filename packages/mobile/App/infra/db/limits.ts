/** @see https://www.sqlite.org/limits.html#max_variable_number */
export const SQLITE_MAX_PARAMETERS = 32766;

/**
 * Calculate the effective insert batch size such that the total number of SQL parameters
 * in a multi-row INSERT stays under the SQLite parameter limit.
 */
export const getEffectiveInsertBatchSize = (
  desiredBatchSize: number,
  perRowParameterCount: number,
  sqliteMaxParameters: number = SQLITE_MAX_PARAMETERS,
): number => {
  if (!perRowParameterCount || perRowParameterCount <= 0) return desiredBatchSize;
  const maxRowsByParams = Math.max(1, Math.floor(sqliteMaxParameters / perRowParameterCount));
  return Math.min(desiredBatchSize, maxRowsByParams);
};

/**
 * Calculate the effective update batch size for CASE-based multi-row UPDATE.
 * For each updatable column we bind 2 params per row (id, value), plus one param per row for WHERE id IN (...).
 * So total params ≈ rows * (2 * updatableColumns + 1).
 */
export const getEffectiveUpdateBatchSize = (
  desiredBatchSize: number,
  updatableColumnCount: number,
  sqliteMaxParameters: number = SQLITE_MAX_PARAMETERS,
): number => {
  const perRowParams = (updatableColumnCount > 0) ? (2 * updatableColumnCount + 1) : 1;
  const maxRowsByParams = Math.max(1, Math.floor(sqliteMaxParameters / perRowParams));
  return Math.min(desiredBatchSize, maxRowsByParams);
};
