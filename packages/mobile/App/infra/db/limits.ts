/** @see https://www.sqlite.org/limits.html#max_variable_number */
export const SQLITE_MAX_PARAMETERS = 32766;

/**
 * Calculate a batch size that will not exceed the SQLite parameter limit
 * and is not larger than the desired batch size.
 * @param desiredBatchSize - The desired batch size.
 * @param perRowParameterCount - The number of parameters that is bound per row.
 */
export const getEffectiveBatchSize = (
  desiredBatchSize: number,
  perRowParameterCount: number,
): number => {
  const maxRowsByParams = Math.max(1, Math.floor(SQLITE_MAX_PARAMETERS / perRowParameterCount));
  return Math.min(desiredBatchSize, maxRowsByParams);
};
