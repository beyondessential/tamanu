import { pick } from 'lodash';

import { BaseModel } from '~/models/BaseModel';
import { extractIncludedColumns } from '../metadata';

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
export const mapFields = (mapping: [string, string][], obj: { [key: string]: any }) => {
  const newObj = { ...obj };
  for (const [fromKey, toKey] of mapping) {
    delete newObj[fromKey];
    if (obj.hasOwnProperty(fromKey)) {
      newObj[toKey] = obj[fromKey];
    }
  }
  return newObj;
};

/*
 *   buildFromSyncRecord
 *
 *    Input: a model
 *    Output: a function that will convert a SyncRecord into an object matching that model
 */
export const buildFromSyncRecord = (model: typeof BaseModel, data: object) => {
  const { metadata } = model.getRepository();

  // find columns to include
  const includedColumns = extractIncludedColumns(model);
  // populate `fieldMapping` with `RelationId` to `Relation` mappings (not necessary for `IdRelation`)
  const fieldMapping = getRelationIdsFieldMapping(model);

  const dbRecord = mapFields(fieldMapping, pick(data, includedColumns));
  return dbRecord;
};
