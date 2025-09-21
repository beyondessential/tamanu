import { Repository } from 'typeorm';
import { chunk } from 'lodash';
import { DataToPersist } from '../types';
import { getEffectiveBatchSize } from '../../../infra/db/limits';

const getValuePlaceholdersForRows = (rowCount: number, columnsCount: number): string =>
  Array.from(
    { length: rowCount },
    () => `(${Array.from({ length: columnsCount }, () => '?').join(', ')})`,
  ).join(', ');

const quote = (identifier: string): string => `"${identifier}"`;

/**
 * Much faster than typeorm bulk insert or save
 * Prepare a raw query and execute it with the values
 */
export const executePreparedInsert = async (
  repository: Repository<any>,
  rows: DataToPersist[],
  maxRecordsPerBatch: number,
  progressCallback: (processedCount: number) => void,
) => {
  if (!rows.length) return;

  const { tableName } = repository.metadata;

  const columns = Object.keys(rows[0]);
  const columnNames = columns.map(quote).join(', ');

  const chunkSize = getEffectiveBatchSize(maxRecordsPerBatch, columns.length);

  for (const chunkRows of chunk(rows, chunkSize)) {
    const query = `
    INSERT INTO ${tableName} (${columnNames}) 
    VALUES ${getValuePlaceholdersForRows(chunkRows.length, columns.length)}
  `;
    const parameters = chunkRows.flatMap(row => columns.map(col => row[col]));
    try {
      await repository.query(query, parameters);
    } catch (e: any) {
      await Promise.all(
        chunkRows.map(async row => {
          try {
            await repository.insert(row);
          } catch (error: any) {
            throw new Error(`Insert failed with '${error.message}', recordId: ${row.id}`);
          }
        }),
      );
    }
    progressCallback(chunkRows.length);
  }
};

/**
 * Prepare a raw update query and execute it with the values
 */
export const executePreparedUpdate = async (
  repository: Repository<any>,
  rows: DataToPersist[],
  maxRecordsPerBatch: number,
  progressCallback: (processedCount: number) => void,
) => {
  if (!rows.length) return;

  const { tableName } = repository.metadata;

  const columns = Object.keys(rows[0]);
  const updatableColumns = columns.filter(col => col !== 'id');
  const updateColumnsQuoted = updatableColumns.map(quote);
  const cteColumns = [quote('id'), ...updateColumnsQuoted];

  const setFragments = updateColumnsQuoted
    .map(col => `${col} = (SELECT ${col} FROM updates WHERE updates.id = ${tableName}.id)`)
    .join(', ');

  // Per row we bind one id plus one parameter per updatable column
  const chunkSize = getEffectiveBatchSize(maxRecordsPerBatch, cteColumns.length);

  for (const chunkRows of chunk(rows, chunkSize)) {
    const query = `
    WITH updates (${cteColumns.join(', ')}) AS (VALUES ${getValuePlaceholdersForRows(chunkRows.length, cteColumns.length)})
    UPDATE ${tableName} SET ${setFragments} WHERE id IN (SELECT id FROM updates)
  `;

    const parameters: any[] = [];
    for (const row of chunkRows) {
      parameters.push(row.id);
      for (const col of updatableColumns) {
        parameters.push(row[col]);
      }
    }

    try {
      await repository.query(query, parameters);
    } catch (e: any) {
      await Promise.all(
        chunkRows.map(async row => {
          try {
            await repository.update({ id: row.id }, row);
          } catch (error: any) {
            throw new Error(`Update failed with '${error.message}', recordId: ${row.id}`);
          }
        }),
      );
    }
    progressCallback(chunkRows.length);
  }
};
