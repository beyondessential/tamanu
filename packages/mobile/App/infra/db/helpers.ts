import { chunk } from 'lodash';

export const formatDateForQuery = (date: Date): number => date.valueOf() / 1000;

export const SQLITE_INSERT_CHUNK_SIZE = 500;

type RowLike = {
  [key: string]: any;
};
export function chunkRows<T extends RowLike>(rows: T[]): T[][] {
  return chunk(rows, SQLITE_INSERT_CHUNK_SIZE);
}
