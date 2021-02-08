import { without } from 'lodash';

import { BaseModel } from '~/models/BaseModel';

export type RelationsTree = {
  [key: string]: RelationsTree,
};

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

export const extractRelationsTree = (model: typeof BaseModel) => {
  return propertyPathsToTree(model.includedSyncRelations);
};

/*
 *   extractSyncMetadata
 *
 *    Input: a model, and an optional tree of relations to nest, intended to be used recursively
 *    Output: columns to include, a tree of relations, and an object of converters for relations on the model itself
 */
export const extractIncludedColumns = (model: typeof BaseModel) => {
  const { metadata } = model.getRepository();

  // find columns to include
  const allColumns = [
    ...metadata.columns,
    ...metadata.relationIds, // typeorm thinks these aren't columns
  ].map(({ propertyName }) => propertyName);
  const includedColumns = without(allColumns, ...model.excludedSyncColumns);

  return includedColumns;
};

