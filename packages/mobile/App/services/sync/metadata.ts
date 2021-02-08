import { without } from 'lodash';

import { BaseModel } from '~/models/BaseModel';

export type RelationsTree = {
  [key: string]: RelationsTree,
};

type ConverterFunc = (record: object) => object;

type BuildConverterFunc = (model: typeof BaseModel, withRelationsTree?: RelationsTree) => ConverterFunc;

/*
 *   propertyPathsToTree
 *
 *   Input: ['a.b', 'a.b.c', 'a.b.d']
 *   Output: {a: {b: {c: {}, d: {}}}}
 */
export const propertyPathsToTree = (stringPaths: string[]): RelationsTree => {
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
 *   extractSyncMetadata
 *
 *    Input: a model, and an optional tree of relations to nest, intended to be used recursively
 *    Output: columns to include, a tree of relations, and an object of converters for relations on the model itself
 */
export const extractSyncMetadata = (model: typeof BaseModel, buildConverter: BuildConverterFunc, withRelationsTree?: RelationsTree) => {
  const { metadata } = model.getRepository();

  // find columns to include
  const allColumns = [
    ...metadata.columns,
    ...metadata.relationIds, // typeorm thinks these aren't columns
  ].map(({ propertyName }) => propertyName);
  const includedColumns = without(allColumns, ...model.excludedSyncColumns);

  // build map of immedate relationships to their nested children
  let relationsTree = withRelationsTree;
  if (!relationsTree) {
    relationsTree = propertyPathsToTree(model.includedSyncRelations);
  }

  // build toSyncRecord functions for all included relations
  const converters = Object.entries(relationsTree)
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
        [relationName]: buildConverter(
          relationModel as typeof BaseModel,
          nestedRelationsTree,
        ),
      };
    }, {});

  return {
    includedColumns,
    relationsTree,
    converters,
  };
};

