import { MoreThan } from 'typeorm';
import { pick } from 'lodash';

import { BaseModel } from '../../../models/BaseModel';
import { SyncRecord, SyncRecordData } from '../types';
import { MODELS_MAP } from '../../../models/modelsMap';
import { extractIncludedColumns } from './extractIncludedColumns';

const buildToSyncRecord = (model: typeof BaseModel, record: object): SyncRecord => {
  const includedColumns = extractIncludedColumns(model);
  const data = pick(record, includedColumns) as SyncRecordData;

  return {
    recordId: data.id,
    isDeleted: !!data.deletedAt,
    recordType: model.getTableNameForSync(),
    data,
  };
};

/**
 * Get all the records that have updatedAtSyncTick > the last successful sync index,
 * meaning that these records have been updated since the last successful sync
 * @param models
 * @param since
 * @returns
 */
export const snapshotOutgoingChanges = async (
  models: typeof MODELS_MAP,
  since: number,
): Promise<SyncRecord[]> => {
  const outgoingChanges = [];

  for (const model of Object.values(models)) {
    const changesForModel = await model.find({
      where: { updatedAtSyncTick: MoreThan(since) },
    });
    const syncRecordsForModel = changesForModel.map(change => buildToSyncRecord(model, change));
    outgoingChanges.push(...syncRecordsForModel);
  }

  return outgoingChanges;
};
