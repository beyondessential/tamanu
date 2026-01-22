export const DEFAULT_BATCH_SIZE = 10000;

export async function runFunctionInBatches<T, R>(
  arrayToBeBatched: T[],
  functionToRun: (batch: T[]) => Promise<R[]>,
  batchSize = DEFAULT_BATCH_SIZE,
): Promise<R[]> {
  if (batchSize <= 0) {
    throw new Error('batchSize must be a positive number.');
  }

  const results: R[] = [];
  for (let i = 0; i < arrayToBeBatched.length; i += batchSize) {
    const batch = arrayToBeBatched.slice(i, i + batchSize);
    const chunkedResult = await functionToRun(batch);
    results.push(...chunkedResult);
  }
  return results;
}
