import { pick } from 'lodash';

import { DataToPersist, SyncRecord } from '../types';
import { BaseModel } from '../../../models/BaseModel';
import { extractIncludedColumns } from './extractIncludedColumns';

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
  { data, isDeleted }: SyncRecord,
  includedColumns: string[],
): DataToPersist => {
  const record = pick(data, includedColumns);
  record.isDeleted = isDeleted;
  return record;
};

export const buildFromSyncRecords = (
  model: typeof BaseModel,
  records: SyncRecord[],
): DataToPersist[] => {
  const includedColumns = extractIncludedColumns(model);
  // populate `fieldMapping` with `RelationId` to `Relation` mappings
  // (not necessary for `IdRelation`)
  const fieldMapping = getRelationIdsFieldMapping(model);
  return records.map(record =>
    mapFields(fieldMapping, pickBySelectedColumns(record, includedColumns)),
  );
};

export const buildForRawInsertFromSyncRecords = (
  model: typeof BaseModel,
  records: SyncRecord[],
): DataToPersist[] => {
  const includedColumns = extractIncludedColumns(model);
  // Skip field mapping for raw insert - keep original field names
  return records.map(record => pickBySelectedColumns(record, includedColumns));
};
