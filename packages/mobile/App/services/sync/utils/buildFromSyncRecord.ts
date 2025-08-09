import { pick } from 'lodash';

import { DataToPersist, SyncRecord } from '../types';
import { BaseModel } from '../../../models/BaseModel';

export const getRelationIdsFieldMapping = (model: typeof BaseModel) =>
  (model as any)
    .getRepository()
    .metadata.relationIds.map((rid): [string, string] => [
      rid.propertyName,
      rid.relation.propertyName,
    ]);

/*
 *    mapFields
 *
 *      Input: [['fooId', 'foo']], { fooId: '123abc' }
 *      Output: { foo: '123abc' }
 */
const mapFields = (mapping: [string, string][], obj: { [key: string]: unknown }): DataToPersist => {
  const newObj = { ...obj };
  for (const [fromKey, toKey] of mapping) {
    delete newObj[fromKey];
    if (Object.prototype.hasOwnProperty.call(obj, fromKey)) {
      newObj[toKey] = obj[fromKey];
    }
  }
  return newObj;
};

export const pickBySelectedColumns = (
  { data }: SyncRecord,
  includedColumns: string[],
): DataToPersist => {
  const record = pick(data, includedColumns);
  return record;
};

export const buildFromSyncRecords = (
  model: typeof BaseModel,
  records: SyncRecord[],
): DataToPersist[] => {
  const { includedColumns, fieldMapping } = model;
  return records.map(record =>
    mapFields(fieldMapping, pickBySelectedColumns(record, includedColumns)),
  );
};

export const buildForRawInsertFromSyncRecords = (
  model: typeof BaseModel,
  records: SyncRecord[],
): DataToPersist[] => {
  const { includedColumns } = model;
  // Skip field mapping for raw insert - keep original field names
  return records.map(record => {
    const data = pickBySelectedColumns(record, includedColumns);
    data.isDeleted = record.isDeleted;
    return data;
  });
};
