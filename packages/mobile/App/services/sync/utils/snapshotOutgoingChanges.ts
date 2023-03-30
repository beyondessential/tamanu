import { MoreThan } from 'typeorm';
import { pick } from 'lodash';

import { BaseModel } from '../../../models/BaseModel';
import { SyncRecord, SyncRecordData } from '../types';
import { MODELS_MAP } from '../../../models/modelsMap';
import { extractIncludedColumns } from './extractIncludedColumns';
import { Database } from '~/infra/db';

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
 * @param outgoingModels
 * @param since
 * @returns
 */
export const snapshotOutgoingChanges = async (
  outgoingModels: typeof MODELS_MAP,
  since: number,
): Promise<SyncRecord[]> => {
  let outgoingChanges = [];

  // snapshot inside a transaction (Serializable is the default isolation level),
  // so that other changes made while this snapshot
  // is underway aren't included (as this could lead to a pair of foreign records with the child in
  // the snapshot and its parent missing)
  // as the snapshot only contains read queries, there will be no concurrent update issues :)
  return Database.client.transaction(async () => {
    for (const model of Object.values(outgoingModels)) {
      const changesForModel = await model.find({
        where: { updatedAtSyncTick: MoreThan(since) },
      });
      const syncRecordsForModel = changesForModel.map(change => buildToSyncRecord(model, change));
      const sanitizedSyncRecords = model.sanitizeRecordDataForPush
        ? model.sanitizeRecordDataForPush(syncRecordsForModel)
        : syncRecordsForModel;

      outgoingChanges = outgoingChanges.concat(sanitizedSyncRecords);
    }

    return outgoingChanges;
  });
};
