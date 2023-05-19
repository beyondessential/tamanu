import { chunk } from 'lodash';

export const formatDateForQuery = (date: Date): number => date.valueOf() / 1000;

// SQLite < v3.32 has a hard limit of 999 bound parameters per query
// see https://www.sqlite.org/limits.html for more
export const SQLITE_MAX_PARAMETERS = 999;
type RowLike = {
  [key: string]: any;
};
export function chunkRows<T extends RowLike>(rows: T[]): T[][] {
  let maxColumnsPerRow = 0;
  rows.forEach(r => {
    const propertiesCount = Object.keys(r).length;
    if (propertiesCount > maxColumnsPerRow) {
      maxColumnsPerRow = propertiesCount;
    }
  });

  const rowsPerChunk = Math.floor(SQLITE_MAX_PARAMETERS / maxColumnsPerRow);
  return chunk(rows, rowsPerChunk);
}
