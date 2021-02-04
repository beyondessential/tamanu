import { without, pick, memoize } from 'lodash';

import { SyncRecord, SyncRecordData } from './source';
import { BaseModel } from '~/models/BaseModel';

type RelationsTree = {
  [key: string]: RelationsTree,
};

/*
 *   propertyPathsToTree
 *
 *   Input: ['a.b', 'a.b.c', 'a.b.d']
 *   Output: {a: {b: {c: {}, d: {}}}}
 */
const propertyPathsToTree = (stringPaths: string[]): RelationsTree => {
  const propertyArrayPathsToTree = (paths: string[][]): RelationsTree => {
    const grouped: { [key: string]: string[][] } = paths.reduce(
      (memo, [first, ...remaining]) => {
        const leaves = memo[first] || [];
        if (remaining.length > 0) {
          leaves.push(remaining)
        }
        return {
          ...memo,
          [first]: leaves,
        };
      },
      {},
    );
    return Object.entries(grouped).reduce((memo, [path, remaining]) => {
      const subTree = remaining.length > 0 ? propertyArrayPathsToTree(remaining) : {};
      return {
        ...memo,
        [path]: subTree,
      };
    }, {});
  };
  return propertyArrayPathsToTree(stringPaths.map(path => path.split('.')));
};

/*
 *   buildExportSyncRecord
 *
 *   Input: a model (and a tree of relations, mostly used internally to recursively export relations)
 *   Output: a function that will convert instances of that model into a SyncRecord
 */
export const buildExportSyncRecord = memoize((model: typeof BaseModel, withRelationsTree?: RelationsTree) => {
  // TODO: handle lazy and/or embedded relations

  const { metadata } = model.getRepository();

  // find columns to include
  const allColumns = [
    ...metadata.columns,
    ...metadata.relationIds, // typeorm thinks these aren't columns
  ].map(({ propertyName }) => propertyName);
  const includedColumns = without(allColumns, ...model.excludedUploadColumns);

  // build map of immedate relationships to their nested children
  let relationsTree = withRelationsTree;
  if (!relationsTree) {
    relationsTree = propertyPathsToTree(model.includedUploadRelations);
  }

  // build toSyncRecord functions for all included relations
  const relationToSyncRecord = Object.entries(relationsTree)
    .reduce((memo, [relationName, nestedRelationsTree]) => {
      const relationModel = metadata
        .relations
        .find(r => r.propertyPath === relationName)
        .inverseEntityMetadata
        .target;
      if (typeof relationModel !== 'function') {
        console.warn('sync: unable to generate converter for relation ${relationName}');
        return memo;
      }
      return {
        ...memo,
        [relationName]: buildExportSyncRecord(
          relationModel as typeof BaseModel,
          nestedRelationsTree,
        ),
      };
    }, {});

  // actual function
  return (entity: object): SyncRecord => {
    // pick included columns
    const data = pick(entity, includedColumns) as SyncRecordData;

    // recursively convert relations
    for (const relationName of Object.keys(relationsTree)) {
      const relation = entity[relationName];
      if (!!relation) {
        data[relationName] = relation.map(relationToSyncRecord[relationName]);
      }
    }

    return { data };
  };
});

