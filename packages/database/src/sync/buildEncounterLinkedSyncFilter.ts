import { Utils } from 'sequelize';
import { isObject, isString } from 'lodash';
import type { JoinConfig } from './buildEncounterLinkedLookupFilter';

export function buildEncounterLinkedSyncFilterJoins(tablesToTraverse: (string | JoinConfig)[]) {
  return tablesToTraverse
    .slice(1)
    .map((table, i) => {
      const currentTable = isString(tablesToTraverse[i])
        ? tablesToTraverse[i]
        : tablesToTraverse[i]?.tableName;

      const joinTable = isString(table) ? table : table.tableName;
      const joinColumn = isString(table) ? `${Utils.singularize(table)}_id` : table.columnName;
      const joinType = isObject(table) ? table.joinType : 'LEFT';

      return `
        ${joinType} JOIN ${joinTable} ON ${currentTable}.${joinColumn} = ${joinTable}.id
      `;
    })
    .join('\n');
}

export function buildEncounterLinkedSyncFilter(
  tablesToTraverse: string[], // e.g. [ 'survey_response_answers', 'survey_responses', 'encounters'] to traverse up from survey_response_answers
  markedForSyncPatientsTable: string,
) {
  const joins = buildEncounterLinkedSyncFilterJoins(tablesToTraverse);
  return `
    ${joins}
    WHERE encounters.patient_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable})
    AND ${tablesToTraverse[0]}.updated_at_sync_tick > :since
  `;
}
