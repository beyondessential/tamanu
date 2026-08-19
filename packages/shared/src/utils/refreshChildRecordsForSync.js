import { snakeCase } from 'es-toolkit/compat';

import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { getDependentAssociations } from './getDependentAssociations';

// bounds the bind-parameter list when a level of the tree is very wide
const REFRESH_CHUNK_SIZE = 5000;

/**
 * Update child records by setting updated_at_sync_tick = 1
 * so that they are refreshed in the sync_lookup table,
 * and also pulled down to the clients.
 *
 * Walks the dependency tree level by level with one query per association and
 * chunk, rather than one query per record, so refreshing a patient's full tree
 * costs a handful of queries instead of one per descendant.
 * @param {*} model
 * @param {string[]} instanceIds
 */
export async function refreshChildRecordsForSync(model, instanceIds) {
  if (instanceIds.length === 0) return;

  const dependantAssociations = getDependentAssociations(model);

  for (const association of dependantAssociations) {
    const { target, foreignKey } = association;

    if (target.syncDirection === SYNC_DIRECTIONS.DO_NOT_SYNC) {
      continue;
    }

    for (let start = 0; start < instanceIds.length; start += REFRESH_CHUNK_SIZE) {
      const chunkOfIds = instanceIds.slice(start, start + REFRESH_CHUNK_SIZE);

      // We need to go via a raw query as Model.update({}) performs validation on the
      // whole record, so we'll be rejected for failing to include required fields -
      // even though we only want to update updated_at_sync_tick!
      const [updatedRows] = await model.sequelize.query(
        `
          UPDATE ${target.tableName}
          SET updated_at_sync_tick = 1
          WHERE ${snakeCase(foreignKey)} IN (:chunkOfIds)
          RETURNING id;
        `,
        {
          replacements: {
            chunkOfIds,
          },
        },
      );

      // If there are any child records, also recursively update them
      // so that they are also updated in the sync_lookup table
      // eg: if survey_response is updated, we must also updated survey_response_answers
      await refreshChildRecordsForSync(
        target,
        updatedRows.map(updatedRow => updatedRow.id),
      );
    }
  }
}
