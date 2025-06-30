import { chunk } from 'lodash';

export const formatDateForQuery = (date: Date): number => date.valueOf() / 1000;

export const SQLITE_MAX_BULK_INSERT_ROWS = 997;

type RowLike = {
  [key: string]: any;
};
export function chunkRows<T extends RowLike>(rows: T[]): T[][] {
  return chunk(rows, SQLITE_MAX_BULK_INSERT_ROWS);
}
