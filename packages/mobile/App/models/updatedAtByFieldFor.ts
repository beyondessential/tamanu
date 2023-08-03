import { snakeCase, isEmpty } from 'lodash';
import { CURRENT_SYNC_TIME, getSyncTick } from '~/services/sync';
import { Database } from '~/infra/db';
import { extractIncludedColumns } from '~/services/sync/utils/extractIncludedColumns';
import { BaseModel } from './BaseModel';

export async function setUpdatedAtByFieldFor(
  Model: typeof BaseModel,
  that: InstanceType<typeof Model>,
): Promise<void> {
  const syncTick = await getSyncTick(Database.models, CURRENT_SYNC_TIME);
  const excludedColumns = [...Model.excludedSyncColumns, 'deletedAt', 'updatedAtByField'];
  const includedColumns = extractIncludedColumns(Model, excludedColumns);
  let newUpdatedAtByField = {};
  const oldModelRecord = await Model.findOne({
    id: that.id,
  });

  // only calculate updatedAtByField if a modified version hasn't been explicitly passed,
  // e.g. from a central record syncing down to this device
  if (!oldModelRecord) {
    includedColumns.forEach(camelCaseKey => {
      if (this[snakeCase(camelCaseKey)] !== undefined) {
        newUpdatedAtByField[snakeCase(camelCaseKey)] = syncTick;
      }
    });
  } else if (
    !that.updatedAtByField ||
    that.updatedAtByField === oldModelRecord.updatedAtByField
  ) {
    // retain the old sync ticks from previous updatedAtByField
    newUpdatedAtByField = JSON.parse(oldModelRecord.updatedAtByField);
    includedColumns.forEach(camelCaseKey => {
      const snakeCaseKey = snakeCase(camelCaseKey);
      // when saving relation id for instance, typeorm requires saving using
      // relation name instead (eg: when saving 'nationalityId', the value is in 'nationality')
      const relationKey = camelCaseKey.slice(-2) === 'Id' ? camelCaseKey.slice(0, -2) : null;
      const oldValue = oldModelRecord[camelCaseKey];
      // if this is a relation key, the value may be in form of ( { id: 'abc' } ),
      // or it may be just the id
      const currentValue = relationKey
        ? this[relationKey]?.id || this[relationKey]
        : this[camelCaseKey];

      if (oldValue !== currentValue) {
        newUpdatedAtByField[snakeCaseKey] = syncTick;
      }
    });
  }

  if (!isEmpty(newUpdatedAtByField)) {
    that.updatedAtByField = JSON.stringify(newUpdatedAtByField);
  }
}
