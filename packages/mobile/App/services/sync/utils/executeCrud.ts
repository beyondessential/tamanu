import { cloneDeep, chunk } from 'lodash';
import { In, Repository } from 'typeorm';

import { DataToPersist } from '../types';
import { MAX_RECORDS_IN_BULK_INSERT, SQLITE_MAX_PARAMETERS  } from '../../../infra/db/limits';

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

  for (const batchOfRows of chunk(
    deduplicated,
    Math.min(insertBatchSize, MAX_RECORDS_IN_BULK_INSERT),
  )) {
    try {
      // insert with listeners turned off, so that it doesn't cause a patient to be marked for
      // sync when e.g. an encounter associated with a sync-everywhere vaccine is synced in
      await repository
        .createQueryBuilder()
        .insert({ listeners: false })
        .values(batchOfRows)
        .execute();
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
  try {
    await Promise.all(rows.map(async row => repository.update({ id: row.id }, row)));
  } catch (e) {
    // try records individually, some may succeed and we want to capture the
    // specific one with the error
    await Promise.all(
      rows.map(async row => {
        try {
          await repository.save(row);
        } catch (error) {
          throw new Error(`Update failed with '${error.message}', recordId: ${row.id}`);
        }
      }),
    );
  }
  progressCallback?.(rows.length);
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
  progressCallback?: (processedCount: number) => void,
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
