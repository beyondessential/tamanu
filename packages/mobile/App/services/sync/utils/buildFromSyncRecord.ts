import { pick } from 'lodash';

import { SyncRecordData, DataToPersist } from '../types';
import { BaseModel } from '../../../models/BaseModel';
import { extractIncludedColumns } from './extractIncludedColumns';

export const getRelationIdsFieldMapping = (model: typeof BaseModel) =>
  model
    .getRepository()
    .metadata.relationIds.map((rid): [string, string] => [
      rid.propertyName,
      rid.relation.propertyName,
    ]);

/*
 *    mapFields
 *
 *      Input: [['fooId', 'foo']], { fooId: '123abc' }
 *      Ouput: { foo: '123abc' }
 */
const mapFields = (mapping: [string, string][], obj: { [key: string]: unknown }): DataToPersist => {
  const newObj = { ...obj };
  for (const [fromKey, toKey] of mapping) {
    delete newObj[fromKey];
    if (obj.hasOwnProperty(fromKey)) {
      newObj[toKey] = obj[fromKey];
    }
  }
  return newObj;
};

export const buildFromSyncRecord = (
  model: typeof BaseModel,
  data: SyncRecordData,
): DataToPersist => {
  // find columns to include
  const includedColumns = extractIncludedColumns(model);
  // populate `fieldMapping` with `RelationId` to `Relation` mappings
  // (not necessary for `IdRelation`)
  const fieldMapping = getRelationIdsFieldMapping(model);

  const dbRecord = mapFields(fieldMapping, pick(data, includedColumns));
  return dbRecord;
};
