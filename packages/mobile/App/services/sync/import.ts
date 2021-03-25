import { chunk, pick, memoize, flatten } from 'lodash';

import { SyncRecord } from './source';
import { BaseModel } from '~/models/BaseModel';
import { chunkRows } from '~/infra/db/helpers';
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

export type ImportFailure = {
  error: string,
  recordId: string,
};

export type ImportResponse = {
  failures: ImportFailure[],
};


interface UpsertableSyncRecord extends SyncRecord {
  parentId?: string;
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
 *    Input: a plan created using createImportPlan and records to import, including nested relations
 *    Output: imports the records into the db, returns an object containing any errors
 */
export const executeImportPlan = async (importPlan: ImportPlan, syncRecords: SyncRecord[]) => {
  const { model } = importPlan;

  // split records into create, update, delete
  const ids = syncRecords.map(r => r.data.id);
  const existing = await model.findByIds(ids);
  const existingIdSet = new Set(existing.map(e => e.id));
  const recordsForCreate = syncRecords.filter(r => !r.isDeleted && !existingIdSet.has(r.data.id));
  const recordsForUpdate = syncRecords.filter(r => !r.isDeleted && existingIdSet.has(r.data.id));
  const recordsForDelete = syncRecords.filter(r => r.isDeleted);

  // run each import process
  const { failures: createFailures } = await executeCreates(importPlan, recordsForCreate);
  const { failures: updateFailures } = await executeUpdates(importPlan, recordsForUpdate);
  const { failures: deleteFailures } = await executeDeletes(importPlan, recordsForDelete);

  // return combined failures
  return { failures: [...createFailures, ...updateFailures, ...deleteFailures] };
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
    return { failures: recordIds.map(id => ({
      error: `Delete failed with ${e.message}`,
      recordId: id,
    }))};
  }
  return { failures: [] };
};

const executeUpdateOrCreates = async (
  { model, parentField, fromSyncRecord, children }: ImportPlan,
  syncRecords: UpsertableSyncRecord[],
  buildUpdateOrCreateFn: Function,
): Promise<ImportResponse> => {
  if (syncRecords.length === 0) {
    return { failures: [] };
  }
  const updateOrCreateFn = buildUpdateOrCreateFn(model);
  const rows: { [key: string]: any }[] = syncRecords.map(sr => ({
    ...fromSyncRecord(sr),
    markedForUpload: false,
    [parentField]: sr.parentId,
  }));

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
    const childRecords: UpsertableSyncRecord[] = flatten(syncRecords
      .map(sr => (sr.data[relationName] || [])
        .map(child => ({ ...child, parentId: sr.data.id }))
      ));
    if (childRecords) {
      const { failures: childFailures } = await executeUpdateOrCreates(
        relationPlan,
        childRecords,
        buildUpdateOrCreateFn,
      );
      failures.push(...childFailures)
    }
  }
  return { failures };
};

const executeCreates = async (
  importPlan: ImportPlan,
  syncRecords: SyncRecord[],
) => executeUpdateOrCreates(
  importPlan,
  syncRecords,
  model => async rowOrRows => model.insert(rowOrRows),
);

const executeUpdates = async (
  importPlan: ImportPlan,
  syncRecords: SyncRecord[],
) => executeUpdateOrCreates(
  importPlan,
  syncRecords,
  model => async rowOrRows => {
    const entityOrEntities = model.create(rowOrRows);
    return importPlan.model.save(entityOrEntities, { listeners: false });
  }
);

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
  if (typeof key !== 'string' || key === 'displayId' || key === 'deviceId') {
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
