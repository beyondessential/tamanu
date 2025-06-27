import { chunk } from 'lodash';

export const formatDateForQuery = (date: Date): number => date.valueOf() / 1000;

export const SEQUELIZE_MAX_PARAMETERS = 32766;

const MAX_CHUNK_SIZE = 500;

type RowLike = {
  [key: string]: any;
};
export function chunkRows<T extends RowLike>(rows: T[]): T[][] {
  const rowsPerChunk = Math.floor(Math.min(MAX_CHUNK_SIZE, rows.length));
  return chunk(rows, rowsPerChunk);
}
