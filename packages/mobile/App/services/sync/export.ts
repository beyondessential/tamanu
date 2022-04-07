import { pick, memoize } from 'lodash';

import { SyncRecord, SyncRecordData } from './source';
import { BaseModel } from '~/models/BaseModel';
import { RelationsTree, extractRelationsTree, extractIncludedColumns } from './metadata';

// TODO: handle lazy and/or embedded relations

type ExportPlan = {
  toSyncRecord: (record: BaseModel) => SyncRecord
  children: {
    [relationName: string]: ExportPlan,
  },
}

/*
 *    createExportPlan
 *
 *     Input: a model
 *     Output: a plan to export that model
 */
export const createExportPlan = memoize((model: typeof BaseModel) => {
  return createExportPlanInner(model, extractRelationsTree(model));
});

/*
 *    executeExportPlan
 *
 *     Input: a plan created by createExportPlan, and a record to export
 *     Output: an object representing the exported record
 */
export const executeExportPlan = (
  { toSyncRecord, children }: ExportPlan,
  record: BaseModel,
): SyncRecord => {
  const { data } = toSyncRecord(record);
  for (const [relationName, relationPlan] of Object.entries(children)) {
    const relation = record[relationName];
    if (!!relation) {
      data[relationName] = relation.map(
        (r: BaseModel) => executeExportPlan(relationPlan, r),
      );
    }
  }
  return { data };
};

const createExportPlanInner = (model: typeof BaseModel, relationsTree: RelationsTree | null) => {
  const children = Object.entries(relationsTree)
    .reduce((memo, [relationName, nestedRelationsTree]) => {
      const nestedModel = model
        .getRepository()
        .metadata
        .relations
        .find(r => r.propertyPath === relationName)
        .inverseEntityMetadata
        .target;
      if (typeof nestedModel !== 'function') {
        console.warn('sync: unable to generate converter for relation ${relationName}');
        return memo;
      }
      return {
        ...memo,
        [relationName]: createExportPlanInner(
          nestedModel as typeof BaseModel,
          nestedRelationsTree,
        ),
      };
    }, {});

  return {
    children,
    toSyncRecord: buildToSyncRecord(model),
  };
};

/*
 *   buildToSyncRecord
 *
 *   Input: a model
 *   Output: a function that will convert an object matching that model into a SyncRecord
 */
const buildToSyncRecord = (model: typeof BaseModel): ((data: object) => SyncRecord) => {
  // TODO: handle lazy and/or embedded relations
  const includedColumns = extractIncludedColumns(model);
  return (dbRecord: object): SyncRecord => {
    const data = pick(dbRecord, includedColumns) as SyncRecordData;

    return { data };
  };
};

