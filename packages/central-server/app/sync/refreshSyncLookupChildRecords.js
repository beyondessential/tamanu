import { snakeCase } from 'lodash';

import { NOTIFY_CHANNELS } from '@tamanu/constants';
import { getDependantAssociations } from '@tamanu/shared/utils';

export async function updateDependentRecord(model, instanceId) {
  const dependantAssociations = getDependantAssociations(model);

  for (const association of dependantAssociations) {
    const { target, foreignKey } = association;
    const [updatedRows] = await model.sequelize.query(
      `
      UPDATE ${target.tableName}
      SET updated_at_sync_tick = 1
      WHERE ${snakeCase(foreignKey)} = :instanceId
      RETURNING id;
    `,
      {
        replacements: {
          instanceId,
        },
      },
    );

    // If there are any child records, also update them so that they are updated in the sync_lookup table too
    for (const updatedRow of updatedRows) {
      await updateDependentRecord(target, updatedRow.id);
    }
  }
}

export const refreshSyncLookupChildRecords = async ({ models, dbNotifier }) => {
  const onTableChanged = dbNotifier.listeners[NOTIFY_CHANNELS.TABLE_CHANGED];
  onTableChanged(async payload => {
    if (payload.event === 'UPDATE' && payload.changes?.includes('patient_id')) {
      const model = Object.values(models).find(model => model.tableName === payload.table);
      await updateDependentRecord(model, payload.newId);
    }
  });
};
