import { MoreThanOrEqual } from 'typeorm';
import { pick } from 'lodash';

import { BaseModel } from '../../../models/BaseModel';
import { SyncRecord, SyncRecordData } from '../types';
import { extractIncludedColumns } from '../metadata';
import { MODELS_MAP } from '~/models/modelsMap';

const buildToSyncRecord = (model: typeof BaseModel, record: object): SyncRecord => {
  const includedColumns = extractIncludedColumns(model);
  const data = pick(record, includedColumns) as SyncRecordData;

  return { recordType: model.getPluralTableName(), data };
};

export const snapshotOutgoingChanges = async (
  models: typeof MODELS_MAP,
  fromSessionIndex: number,
): Promise<SyncRecord[]> => {
  const outgoingChanges = [];
  for (const model of Object.values(models)) {
    const changesForModel = await model.find({
      where: { updatedAtSyncIndex: MoreThanOrEqual(fromSessionIndex) },
    });
    const syncRecordsForModel = changesForModel.map(change => buildToSyncRecord(model, change));
    outgoingChanges.push(...syncRecordsForModel);
  }

  return outgoingChanges;
};
