import { pick, memoize } from 'lodash';

import { SyncRecord } from './source';
import { BaseModel } from '~/models/BaseModel';
import { RelationsTree, extractRelationsTree, extractIncludedColumns } from './metadata';

// TODO: handle lazy and/or embedded relations

export type ImportPlan = {
  model: typeof BaseModel,
  parentField?: string,
  fromSyncRecord: (syncRecord: SyncRecord) => object,
  children: {
    [name: string]: ImportPlan,
  },
}

/*
 *   createImportPlan
 *
 *    Input: a model
 *    Output: a plan to import that model
 */
export const createImportPlan = memoize((model: typeof BaseModel) => {
  const relationsTree = extractRelationsTree(model);
  return createImportPlanInner(model, relationsTree, null);
});

/*
 *   executeImportPlan
 *
 *    Input: a plan created using createImportPlan and a record to import, including nested relations
 *    Output: imports the record into the db
 */
export const executeImportPlan = async (importPlan: ImportPlan, syncRecord: SyncRecord) => {
  return executeImportPlanInner(importPlan, syncRecord);
}

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

const executeImportPlanInner = async (
  { model, parentField, fromSyncRecord, children }: ImportPlan,
  syncRecord: SyncRecord,
  parentId?: string,
) => {
  if (syncRecord.isDeleted) {
    await model.delete({ id: syncRecord.data.id });
  } else {
    const fields: { [key: string]: any } = {
      ...fromSyncRecord(syncRecord),
      markedForUpload: false,
    };
    if (!!parentId) {
      fields[parentField] = parentId;
    }
    const existing = await model.count({ id: fields.id });
    if (existing > 0) {
      await model.update(fields.id, fields);
    } else {
      await model.createAndSaveOne(fields);
    }
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

/*
 *   buildFromSyncRecord
 *
 *    Input: a model
 *    Output: a function that will convert a SyncRecord into an object matching that model
 */
const buildFromSyncRecord = (model: typeof BaseModel) => {
  const includedColumns = extractIncludedColumns(model);

  return ({ data }: SyncRecord): object => {
    const dbRecord = stripIdSuffixes(pick(data, includedColumns));
    return dbRecord;
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
