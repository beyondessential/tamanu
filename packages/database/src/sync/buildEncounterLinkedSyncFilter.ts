import { Utils } from 'sequelize';
import { isObject, isString } from 'lodash';
import { Model } from '../models/Model';

export type JoinConfig =
  | string
  | {
      model: typeof Model;
      joinColumn: string;
      required?: boolean;
    };

export function buildEncounterLinkedSyncFilterJoins(tablesToTraverse: JoinConfig[]) {
  return tablesToTraverse
    .slice(1)
    .map((table, i) => {
      const currentTable = isString(tablesToTraverse[i])
        ? tablesToTraverse[i]
        : tablesToTraverse[i]?.model.tableName;

      const joinTable = isString(table) ? table : table.model.tableName;
      const joinColumn = isString(table) ? `${Utils.singularize(table)}_id` : table.joinColumn;
      const joinType = isObject(table) && table.required ? 'INNER' : 'LEFT';

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
