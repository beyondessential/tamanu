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

  const isTasksWithParentFk = tableName === 'tasks' && columns.includes('parentTaskId');

  // Ensure parent tasks are inserted before child tasks to satisfy tasks.parentTaskId FK
  if (isTasksWithParentFk) {
    const pending = [...rows];

    // Gather all parentTaskIds referenced by these rows
    const referencedParentIds = Array.from(
      new Set(
        pending
          .map(r => (r as any).parentTaskId as string | null | undefined)
          .filter((v): v is string => !!v),
      ),
    );

    // Determine which parent ids already exist in DB (handles incremental sync)
    const existingParentIds = new Set<string>();
    for (const parentIdChunk of chunk(referencedParentIds, 900)) {
      const placeholders = parentIdChunk.map(() => '?').join(', ');
      const existing = await repository.query(
        `SELECT id FROM tasks WHERE id IN (${placeholders})`,
        parentIdChunk,
      );
      for (const row of existing || []) {
        if (row?.id) existingParentIds.add(row.id);
      }
    }

    // Iteratively select rows that are "ready" (no parent, or parent already known)
    const ordered: DataToPersist[] = [];
    const availableIds = new Set<string>(existingParentIds);

    // Note: duplicates can exist; we only use ids for dependency resolution.
    while (pending.length > 0) {
      const ready: DataToPersist[] = [];
      const stillPending: DataToPersist[] = [];

      for (const row of pending) {
        const parentTaskId = (row as any).parentTaskId as string | null | undefined;
        if (!parentTaskId || availableIds.has(parentTaskId)) {
          ready.push(row);
        } else {
          stillPending.push(row);
        }
      }

      if (ready.length === 0) {
        const missingParents = Array.from(
          new Set(
            stillPending
              .map(r => (r as any).parentTaskId as string | null | undefined)
              .filter((v): v is string => !!v),
          ),
        );

        throw new Error(
          `Cannot insert tasks: missing parentTaskId references: ${missingParents.join(', ')}`,
        );
      }

      for (const r of ready) {
        const id = (r as any).id as string | undefined;
        if (id) availableIds.add(id);
      }

      ordered.push(...ready);
      pending.splice(0, pending.length, ...stillPending);
    }

    // Replace rows with the correctly ordered list
    rows = ordered;
  }

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
    WITH updates (${cteColumns.join(', ')}) AS (VALUES ${getValuePlaceholdersForRows(
      chunkRows.length,
      cteColumns.length,
    )})
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
