import { chunk } from 'lodash';

import { DataToPersist } from '../types';
import { chunkRows, SQLITE_MAX_PARAMETERS } from '../../../infra/db/helpers';
import { BaseModel } from '../../../models/BaseModel';

export const executeInserts = async (
  model: typeof BaseModel,
  rows: DataToPersist[],
): Promise<void> => {
  for (const batchOfRows of chunkRows(rows)) {
    try {
      await model.insert(batchOfRows);
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
): Promise<void> => {
  for (const batchOfRows of chunkRows(rows)) {
    try {
      await Promise.all(batchOfRows.map(async row => model.update({ id: row.id }, row)));
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
): Promise<void> => {
  for (const batchOfIds of chunk(rowIds, SQLITE_MAX_PARAMETERS)) {
    try {
      await model.delete(batchOfIds);
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
