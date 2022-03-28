import { pick, memoize, flatten, chunk } from 'lodash';

import { SyncRecord } from './source';
import { BaseModel } from '~/models/BaseModel';
import { chunkRows, SQLITE_MAX_PARAMETERS } from '~/infra/db/helpers';
import { RelationsTree, extractRelationsTree, extractIncludedColumns } from './metadata';

// TODO: handle lazy and/or embedded relations

export type ImportPlan = {
  model: typeof BaseModel;
  parentField?: string;
  fromSyncRecord: (syncRecord: SyncRecord) => object;
  children: {
    [name: string]: ImportPlan;
  };
}

export type ImportFailure = {
  error: string;
  recordId: string;
};

export type ImportResponse = {
  failures: ImportFailure[];
};

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
 *    Input: a plan created using createImportPlan and records to import, including nested relations
 *    Output: imports the records into the db, returns an object containing any errors
 */
export const executeImportPlan = async (
  importPlan: ImportPlan,
  syncRecords: SyncRecord[],
): Promise<ImportResponse> => {
  const { model } = importPlan;

  // split records into create, update, delete
  const ids = syncRecords.map(r => r.data.id);
  const existingIdSet = new Set();
  for (const batchOfIds of chunk(ids, SQLITE_MAX_PARAMETERS)) {
    const batchOfExisting = await model.findByIds(batchOfIds, { select: ['id'] });
    batchOfExisting.forEach(r => existingIdSet.add(r.id));
  }
  const recordsForCreate = syncRecords.filter(r => !r.isDeleted && !existingIdSet.has(r.data.id));
  const recordsForUpdate = syncRecords.filter(r => !r.isDeleted && existingIdSet.has(r.data.id));
  const recordsForDelete = syncRecords.filter(r => r.isDeleted);

  // run each import process
  const { failures: createFailures } = await executeCreates(importPlan, recordsForCreate);
  const { failures: updateFailures } = await executeUpdates(importPlan, recordsForUpdate);
  const { failures: deleteFailures } = await executeDeletes(importPlan, recordsForDelete);

  // return combined failures
  return { failures: [...createFailures, ...updateFailures, ...deleteFailures] };
};

const createImportPlanInner = (
  model: typeof BaseModel,
  relationsTree: RelationsTree,
  parentField: string | null,
): ImportPlan => {
  const children = {};
  const relations = model.getRepository().metadata.relations;
  for (const [name, nestedTree] of Object.entries(relationsTree)) {
    const relationMetadata = relations.find(r => r.propertyPath === name);
    const nestedModel = relationMetadata.inverseRelation.target;
    if (typeof nestedModel === 'function') {
      const nestedParentField = relationMetadata.inverseSidePropertyPath;
      children[name] = createImportPlanInner(
        nestedModel as typeof BaseModel,
        nestedTree,
        nestedParentField,
      );
    }
  }

  return {
    model,
    parentField,
    fromSyncRecord: buildFromSyncRecord(model),
    children,
  };
};

const executeDeletes = async (
  { model }: ImportPlan,
  syncRecords: SyncRecord[],
): Promise<ImportResponse> => {
  if (syncRecords.length === 0) {
    return { failures: [] };
  }
  const recordIds = syncRecords.map(r => r.data.id);
  try {
    // if records don't exist, it will just ignore them rather than throwing an error
    await model.delete(recordIds);
  } catch (e) {
    return {
      failures: recordIds.map(id => ({
        error: `Delete failed with ${e.message}`,
        recordId: id,
      }))
    };
  }
  return { failures: [] };
};

const executeUpdateOrCreates = async (
  { model, fromSyncRecord, children }: ImportPlan,
  syncRecords: SyncRecord[],
  buildUpdateOrCreateFn: Function,
): Promise<ImportResponse> => {
  if (syncRecords.length === 0) {
    return { failures: [] };
  }
  const updateOrCreateFn = buildUpdateOrCreateFn(model);
  const rows: { [key: string]: any }[] = syncRecords.map(sr => {
    const row = {
      ...fromSyncRecord(sr),
      markedForUpload: false,
    };
    return row;
  });

  const failures = [];

  for (const batchOfRows of chunkRows(rows)) {
    try {
      await updateOrCreateFn(batchOfRows);
    } catch (e) {
      // try records individually, some may succeed
      await Promise.all(batchOfRows.map(async row => {
        try {
          await updateOrCreateFn(row);
        } catch (error) {
          failures.push({ error: `Update or create failed with ${error.message}`, recordId: row.id });
        }
      }));
    }
  }

  for (const [relationName, relationPlan] of Object.entries(children)) {
    const childRecords: SyncRecord[] = flatten(syncRecords
      .map(sr => (sr.data[relationName] || [])
        .map(child => ({
          ...child,
          data: { ...child.data, [relationPlan.parentField]: sr.data.id } }))));
    if (childRecords) {
      const { failures: childFailures } = await executeImportPlan(
        relationPlan,
        childRecords,
      );
      failures.push(...childFailures);
    }
  }
  return { failures };
};

const executeCreates = async (
  importPlan: ImportPlan,
  syncRecords: SyncRecord[],
): Promise<ImportResponse> => executeUpdateOrCreates(
  importPlan,
  syncRecords,
  model => async rowOrRows => model.insert(rowOrRows),
);

const executeUpdates = async (
  importPlan: ImportPlan,
  syncRecords: SyncRecord[],
): Promise<ImportResponse> => executeUpdateOrCreates(
  importPlan,
  syncRecords,
  model => async rowOrRows => {
    const rows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows];
    return Promise.all(rows.map(async row => model.update({ id: row.id }, row)));
  },
);

/*
 *   buildFromSyncRecord
 *
 *    Input: a model
 *    Output: a function that will convert a SyncRecord into an object matching that model
 */
const buildFromSyncRecord = (model: typeof BaseModel): (syncRecord: SyncRecord) => object => {
  const { metadata } = model.getRepository();

  // find columns to include
  const includedColumns = extractIncludedColumns(model);
  // populate `fieldMapping` with `RelationId` to `Relation` mappings (not necessary for `IdRelation`)
  const fieldMapping = getRelationIdsFieldMapping(model);

  return ({ data }: SyncRecord): object => {
    const dbRecord = mapFields(fieldMapping, pick(data, includedColumns));
    return dbRecord;
  };
};

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

export const getRelationIdsFieldMapping = (model: typeof BaseModel) =>
  model
    .getRepository()
    .metadata
    .relationIds
    .map((rid): [string, string] => [rid.propertyName, rid.relation.propertyName]);
