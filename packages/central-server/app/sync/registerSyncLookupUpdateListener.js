import { snakeCase } from 'lodash';

import { NOTIFY_CHANNELS } from '@tamanu/constants';
import { getDependentAssociations } from '@tamanu/database';

/**
 * Update child records by setting updated_at_sync_tick = 1
 * so that they are refreshed in the sync_lookup table
 * @param {*} model
 * @param {*} instanceId
 */
export async function updateChildRecordsForSyncLookup(model, instanceId) {
  const dependantAssociations = getDependentAssociations(model);

  for (const association of dependantAssociations) {
    const { target, foreignKey } = association;

    // We need to go via a raw query as Model.update({}) performs validation on the
    // whole record, so we'll be rejected for failing to include required fields -
    // even though we only want to update updated_at_sync_tick!
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

    // If there are any child records, also recursively update them
    // so that they are also updated in the sync_lookup table
    // eg: if survey_response is updated, we must also updated survey_response_answers
    for (const updatedRow of updatedRows) {
      await updateChildRecordsForSyncLookup(target, updatedRow.id);
    }
  }
}


/**
 * Register a listener when a record is updated and the change includes patient_id
 * @param {*} models
 * @param {*} dbNotifier
 */
export const registerSyncLookupUpdateListener = async (models, dbNotifier) => {
  const onTableChanged = dbNotifier.listeners[NOTIFY_CHANNELS.TABLE_CHANGED];
  onTableChanged(async payload => {
    if (payload.event === 'UPDATE' && payload.changedColumns?.includes('patient_id')) {
      const model = Object.values(models).find(model => model.tableName === payload.table);
      await updateChildRecordsForSyncLookup(model, payload.newId);
    }
  });
};
