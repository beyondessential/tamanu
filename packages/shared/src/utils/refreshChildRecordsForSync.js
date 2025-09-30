import { snakeCase } from 'lodash';

import { getDependentAssociations } from '@tamanu/database';
import { SYNC_DIRECTIONS } from '@tamanu/constants';

/**
 * Update child records by setting updated_at_sync_tick = 1
 * so that they are refreshed in the sync_lookup table,
 * and also pulled down to the clients
 * @param {*} model
 * @param {*} instanceId
 */
export async function refreshChildRecordsForSync(model, instanceId) {
  const dependantAssociations = getDependentAssociations(model);

  for (const association of dependantAssociations) {
    const { target, foreignKey } = association;

    if (target.syncDirection === SYNC_DIRECTIONS.DO_NOT_SYNC) {
      continue;
    }

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
      await refreshChildRecordsForSync(target, updatedRow.id);
    }
  }
}
