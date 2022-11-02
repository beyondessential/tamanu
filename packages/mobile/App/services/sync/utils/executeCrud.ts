import { chunk } from 'lodash';

import { DataToPersist } from '../types';
import { chunkRows, SQLITE_MAX_PARAMETERS } from '../../../infra/db/helpers';
import { BaseModel } from '../../../models/BaseModel';

export const executeInserts = async (
  model: typeof BaseModel,
  rows: DataToPersist[],
  progressCallback: (total: number, batchTotal: number, progressMessage: string) => void,
): Promise<void> => {
  let insertedRowsCount = 0;

  for (const batchOfRows of chunkRows(rows)) {
    try {
      await model.insert(batchOfRows);

      insertedRowsCount += batchOfRows.length;
      const totalRowsCount = rows.length;
      const progressMessage = `Stage 3/3: Creating ${totalRowsCount} ${model.name} records`;
      progressCallback(totalRowsCount, insertedRowsCount, progressMessage);
    } catch (e) {
      // try records individually, some may succeed and we want to capture the
      // specific one with the error
      await Promise.all(
        batchOfRows.map(async row => {
          try {
            await model.insert(row);
          } catch (error) {
            throw new Error(`Insert failed with '${error.message}', recordId: ${row.id}`);
          }
        }),
      );
    }
  }
};

export const executeUpdates = async (
  model: typeof BaseModel,
  rows: DataToPersist[],
  progressCallback: (total: number, batchTotal: number, progressMessage: string) => void,
): Promise<void> => {
  let updatedRowsCount = 0;

  for (const batchOfRows of chunkRows(rows)) {
    try {
      await Promise.all(batchOfRows.map(async row => model.update({ id: row.id }, row)));

      updatedRowsCount += batchOfRows.length;
      const totalRowsCount = rows.length;
      const progressMessage = `Stage 3/3: Updating ${totalRowsCount} ${model.name} records`;
      progressCallback(totalRowsCount, updatedRowsCount, progressMessage);
    } catch (e) {
      // try records individually, some may succeed and we want to capture the
      // specific one with the error
      await Promise.all(
        batchOfRows.map(async row => {
          try {
            await model.save(row);
          } catch (error) {
            throw new Error(`Update failed with '${error.message}', recordId: ${row.id}`);
          }
        }),
      );
    }
  }
};

export const executeDeletes = async (
  model: typeof BaseModel,
  rowIds: string[],
  progressCallback: (total: number, batchTotal: number, progressMessage: string) => void,
): Promise<void> => {
  let deletedRowsCount = 0;

  for (const batchOfIds of chunk(rowIds, SQLITE_MAX_PARAMETERS)) {
    try {
      await model.delete(batchOfIds);

      deletedRowsCount += batchOfIds.length;
      const totalRowsCount = rowIds.length;
      const progressMessage = `Stage 3/3: Deleting ${totalRowsCount} ${model.name} records`;
      progressCallback(totalRowsCount, deletedRowsCount, progressMessage);
    } catch (e) {
      // try records individually, some may succeed and we want to capture the
      // specific one with the error
      await Promise.all(
        batchOfIds.map(async id => {
          try {
            await model.delete(id);
          } catch (error) {
            throw new Error(`Delete failed with '${error.message}', recordId: ${id}`);
          }
        }),
      );
    }
  }
};
