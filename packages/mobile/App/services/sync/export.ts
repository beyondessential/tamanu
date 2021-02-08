import { pick, memoize } from 'lodash';

import { SyncRecord, SyncRecordData } from './source';
import { BaseModel } from '~/models/BaseModel';
import { RelationsTree, extractSyncMetadata } from './metadata';

/*
 *   buildToSyncRecord
 *
 *   Input: a model (and a tree of relations, used internally to recursively export relations)
 *   Output: a function that will convert an object matching that model into a SyncRecord
 */
export const buildToSyncRecord = memoize((model: typeof BaseModel, withRelationsTree?: RelationsTree): ((data: object) => SyncRecord) => {
  // TODO: handle lazy and/or embedded relations

  const { includedColumns, relationsTree, converters } =
    extractSyncMetadata(model, buildToSyncRecord, withRelationsTree);

  return (dbRecord: object): SyncRecord => {
    const data = pick(dbRecord, includedColumns) as SyncRecordData;

    for (const relationName of Object.keys(relationsTree)) {
      const relation = dbRecord[relationName];
      if (!!relation) {
        data[relationName] = relation.map(converters[relationName]);
      }
    }

    return { data };
  };
});
