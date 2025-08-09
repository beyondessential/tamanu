import { Repository } from 'typeorm';
import { DataToPersist } from '../types';
import { chunk } from 'lodash';

const getInsertValuesArray = (rows: DataToPersist[], columns: string[]) => {
  return rows.map(row => columns.map(column => row[column])).flat();
};

/**
 * Much faster than typeorm bulk insert or save
 * Prepare a raw query and execute it with the values
 */
export const executePreparedInsert = async (
  repository: Repository<any>,
  rows: DataToPersist[],
  insertBatchSize: number,
  progressCallback: (processedCount: number) => void,
) => {
  const tableName = repository.metadata.tableName;
  const columns = Object.keys(rows[0]);
  const columnNames = columns.map(col => `"${col}"`).join(', ');
  const placeholders = columns.map(() => '?').join(', ');
  for (const batch of chunk(rows, insertBatchSize)) {
    const values = getInsertValuesArray(batch, columns);
    await repository.query(
      `
      INSERT INTO ${tableName} (${columnNames})
      VALUES ${batch.map(() => `(${placeholders})`).join(', ')}
    `,
      values,
    );
    progressCallback(batch.length);
  }
};
