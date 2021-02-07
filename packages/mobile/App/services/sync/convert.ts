import { without, pick, memoize } from 'lodash';

import { SyncRecord, SyncRecordData } from './source';
import { BaseModel } from '~/models/BaseModel';

type RelationsTree = {
  [key: string]: RelationsTree,
};

type ConverterFunc = (record: object) => object;

type BuildConverterFunc = (model: typeof BaseModel, withRelationsTree?: RelationsTree) => ConverterFunc;

export type ImportPlan = {
  model: typeof BaseModel,
  parentField?: string,
  fromSyncRecord: (syncRecord: SyncRecord) => object,
  children: {
    [name: string]: ImportPlan,
  },
}

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
 *   extractSyncMetadata
 *
 *    Input: a model, and an optional tree of relations to nest
 *    Output: columns to include, a tree of relations, and an object of converters for relations on the model itself
 */
const extractSyncMetadata = (model: typeof BaseModel, buildConverter: BuildConverterFunc, withRelationsTree?: RelationsTree) => {
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

const stripId = (key: string | any) => {
  if (typeof key !== 'string' || key === 'displayId') {
    return key;
  }
  return key.replace(/Id$/, '');
}

/*
 *   stripIdSuffixes
 *
 *    TypeORM expects foreign key writes to be done against just the bare name
 *    of the relation, rather than "relationId", but the data is all serialised
 *    as "relationId" - this just strips the "Id" suffix from any fields that
 *    have them. It's a bit of a blunt instrument, but, there you go.
 */
const stripIdSuffixes = (data: object): object => {
  return Object.entries(data)
    .reduce((state, [key, value]) => ({
      ...state,
      [stripId(key)]: value,
    }), {});
}

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

/*
 *   buildFromSyncRecord
 *
 *    Input: a model
 *    Output: a function that will convert a SyncRecord into an object matching that model
 *
 *    Note that unlike buildToSyncRecord, this is not recursive!
 */
const buildFromSyncRecord = memoize((model: typeof BaseModel) => {
  const { includedColumns } =
    extractSyncMetadata(model, buildFromSyncRecord);

  return ({ data }: SyncRecord): object => {
    const dbRecord = stripIdSuffixes(pick(data, includedColumns));
    return dbRecord;
  };
});

/*
 *   createImportPlan
 *
 *    Input: a model
 *    Output: a plan to import that model
 */
const createImportPlanInner = (model: typeof BaseModel, relationsTree: RelationsTree, parentField: string | null) => {
  const children = {};
  for (const [name, nestedTree] of Object.entries(relationsTree)) {
    const relationMetadata = model.getRepository().metadata.relations.find(r => r.propertyPath === name);
    const nestedModel = relationMetadata.inverseRelation.target;
    if (typeof nestedModel === 'function') {
      const nestedParentField = relationMetadata.inverseSidePropertyPath;
      children[name] = createImportPlanInner(
        nestedModel as typeof BaseModel,
        nestedTree,
        nestedParentField,
      );
    }
  };
  return {
    model,
    parentField,
    fromSyncRecord: buildFromSyncRecord(model),
    children,
  };
};

export const createImportPlan = (model: typeof BaseModel) => {
  const relationTree = propertyPathsToTree(model.includedSyncRelations);
  return createImportPlanInner(model, relationTree, null);
};

/*
 *   executeImportPlan
 *
 *    Input: a plan created using createImportPlan and a record to import, including nested relations
 *    Output: imports the record into the db
 */
const executeImportPlanInner = async (
  { model, parentField, fromSyncRecord, children }: ImportPlan,
  syncRecord: SyncRecord,
  parentId?: string,
) => {
  if (syncRecord.isDeleted) {
    await model.delete({ id: syncRecord.data.id });
  } else {
    const fields = {
      ...fromSyncRecord(syncRecord),
      markedForUpload: false,
    };
    if (!!parentId) {
      fields[parentField] = parentId;
    }
    await model.createOrUpdate(fields);
  }
  for (const [relationName, relationPlan] of Object.entries(children)) {
    const childRecords = syncRecord.data[relationName];
    if (childRecords) {
      for (const childRecord of childRecords) {
        await executeImportPlanInner(
          relationPlan,
          childRecord,
          syncRecord.data.id,
        );
      }
    }
  }
};

export const executeImportPlan = async (importPlan: ImportPlan, syncRecord: SyncRecord) => {
  return executeImportPlanInner(importPlan, syncRecord);
}
