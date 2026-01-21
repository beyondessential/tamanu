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
 * Orders task rows so that parent tasks appear before their children, satisfying foreign key constraints.
 *
 * Uses a multi-pass topological sort algorithm:
 * - Pass 1: Inserts tasks with no parent or whose parent is already available
 * - Pass 2: Inserts tasks whose parents were inserted in Pass 1
 * - Pass N: Continues until all tasks are ordered or a circular dependency is detected
 *
 * @param rows - Array of task records to order
 * @param initiallyAvailableParentIds - Set of parent task IDs that already exist (e.g., from previous batches or DB)
 * @returns Ordered array where each task appears after its parent
 * @throws Error if circular dependencies or missing parent references are detected
 */
const orderTasksByParent = (rows: DataToPersist[], initiallyAvailableParentIds: Set<string>) => {
  if (rows.length === 0) return rows;

  const ordered: DataToPersist[] = [];
  const availableIds = new Set<string>(initiallyAvailableParentIds);

  let pending = rows;
  while (pending.length > 0) {
    const ready: DataToPersist[] = [];
    const blocked: DataToPersist[] = [];

    for (const row of pending) {
      const parentTaskId = (row as any).parentTaskId as string | null | undefined;
      if (!parentTaskId || availableIds.has(parentTaskId)) {
        ready.push(row);
      } else {
        blocked.push(row);
      }
    }

    if (ready.length === 0) {
      const missingParents = Array.from(
        new Set(
          blocked
            .map(r => (r as any).parentTaskId as string | null | undefined)
            .filter((v): v is string => !!v),
        ),
      );
      throw new Error(
        `Cannot insert tasks: missing parentTaskId references: ${missingParents.join(', ')}`,
      );
    }

    for (const row of ready) {
      const id = (row as any).id as string | undefined;
      if (id) availableIds.add(id);
    }

    ordered.push(...ready);
    pending = blocked;
  }

  return ordered;
};

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
  // Assumption: All referenced parent tasks are included in the current batch being inserted.
  // This is true for sync operations where the central server sends complete dependency trees.
  if (isTasksWithParentFk) {
    rows = orderTasksByParent(rows, new Set<string>());
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
