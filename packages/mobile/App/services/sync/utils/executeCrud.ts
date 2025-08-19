import { cloneDeep, chunk } from 'lodash';
import { In, Repository } from 'typeorm';

import { DataToPersist } from '../types';
import { SQLITE_MAX_PARAMETERS, getEffectiveInsertBatchSize, getEffectiveUpdateBatchSize } from '../../../infra/db/limits';
import { executePreparedInsert, executePreparedUpdate } from './executePreparedQuery';

function strippedIsDeleted(row) {
  const newRow = cloneDeep(row);
  delete newRow.isDeleted;
  return newRow;
}

export const executeInserts = async (
  repository: Repository<any>,
  rows: DataToPersist[],
  insertBatchSize: number,
  progressCallback: (processedCount: number) => void,
): Promise<void> => {
  // can end up with duplicate create records, e.g. if syncAllLabRequests is turned on, an
  // encounter may turn up twice, once because it is for a marked-for-sync patient, and once more
  // because it has a lab request attached
  const deduplicated = [];
  const idsAdded = new Set();
  const softDeleted = rows.filter(row => row.isDeleted).map(strippedIsDeleted);

  for (const row of rows) {
    const { id } = row;
    if (!idsAdded.has(id)) { 
      deduplicated.push({ ...strippedIsDeleted(row), id });
      idsAdded.add(id);
    }
  }
  // dynamically cap batch size so total SQL parameters stay under the SQLite limit
  const perRowParameterCount = deduplicated.length > 0 ? Object.keys(deduplicated[0]).length : 0;
  const effectiveBatchSize = getEffectiveInsertBatchSize(insertBatchSize, perRowParameterCount);

  for (const batchOfRows of chunk(deduplicated, effectiveBatchSize)) {
    try {
      await executePreparedInsert(repository, batchOfRows);
    } catch (e) {
      // try records individually, some may succeed and we want to capture the
      // specific one with the error
      await Promise.all(
        batchOfRows.map(async row => {
          try {
            await repository.insert(row);
          } catch (error) {
            throw new Error(`Insert failed with '${error.message}', recordId: ${row.id}`);
          }
        }),
      );
    }
    progressCallback(batchOfRows.length);
  }
  // To create soft deleted records, we need to first create them, then destroy them
  if (softDeleted.length > 0) {
    await executeDeletes(repository, softDeleted);
  }
};

export const executeUpdates = async (
  repository: Repository<any>,
  rows: DataToPersist[],
  progressCallback?: (processedCount: number) => void,
): Promise<void> => {
  const allColumns = Object.keys(rows[0]);
  const updatableColumns = allColumns.filter(c => c !== 'id');
  const effectiveBatchSize = getEffectiveUpdateBatchSize(rows.length, updatableColumns.length);

  for (const batchOfRows of chunk(rows, effectiveBatchSize)) {
    try {
      await executePreparedUpdate(repository, batchOfRows);
    } catch (e) {
      // fallback per-row to capture specific failures
      await Promise.all(
        batchOfRows.map(async row => {
          try {
            await repository.update({ id: row.id }, row);
          } catch (error) {
            throw new Error(`Update failed with '${error.message}', recordId: ${row.id}`);
          }
        }),
      );
    }
    progressCallback?.(batchOfRows.length);
  }
};

export const executeDeletes = async (
  repository: Repository<any>,
  recordsForDelete: DataToPersist[],
  progressCallback?: (processedCount: number) => void,
): Promise<void> => {
  const rowIds = recordsForDelete.map(({ id }) => id);
  for (const batchOfIds of chunk(rowIds, SQLITE_MAX_PARAMETERS)) {
    try {
      const entities = await repository.find({ where: { id: In(batchOfIds) } });
      await repository.softRemove(entities);
    } catch (e) {
      // try records individually, some may succeed and we want to capture the
      // specific one with the error
      await Promise.all(
        batchOfIds.map(async id => {
          try {
            const entity = await repository.findOne({ where: { id } });
            await entity.softRemove();
          } catch (error) {
            throw new Error(`Delete failed with '${error.message}', recordId: ${id}`);
          }
        }),
      );
    }
    progressCallback?.(batchOfIds.length);
  }

  await executeUpdates(repository, recordsForDelete);
};

export const executeRestores = async (
  repository: Repository<any>,
  recordsForRestore: DataToPersist[],
  progressCallback: (processedCount: number) => void,
): Promise<void> => {
  const rowIds = recordsForRestore.map(({ id }) => id);
  await Promise.all(
    rowIds.map(async id => {
      try {
        const entity = await repository.findOne({
          where: { id },
          withDeleted: true,
        });
        await entity.recover();
      } catch (error) {
        throw new Error(`Restore failed with '${error.message}', recordId: ${id}`);
      }
    }),
  );
  progressCallback(rowIds.length);
};
