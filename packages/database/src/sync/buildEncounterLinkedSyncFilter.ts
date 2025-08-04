import { Utils } from 'sequelize';

export function buildEncounterLinkedSyncFilterJoins(tablesToTraverse: string[]) {
  return tablesToTraverse
    .slice(1)
    .map(
      (table, i) => `
      LEFT JOIN ${table} ON ${tablesToTraverse[i]}.${Utils.singularize(table)}_id = ${table}.id
    `,
    )
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
