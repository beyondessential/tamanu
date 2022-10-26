import { Utils } from 'sequelize';

export function buildEncounterLinkedSyncFilterJoins(tablesToTraverse) {
  console.log('ttt', tablesToTraverse);
  return tablesToTraverse
    .slice(1)
    .map(
      (table, i) => `
      JOIN ${table} ON ${tablesToTraverse[i]}.${Utils.singularize(table)}_id = ${table}.id
    `,
    )
    .join('\n');
}

export function buildEncounterLinkedSyncFilterWhere() {
  return `
    WHERE
      encounters.patient_id IN ($patientIds)
  `;
}

export function buildEncounterLinkedSyncFilter(
  tablesToTraverse, // e.g. [ 'survey_response_answers', 'survey_responses', 'encounters'] to traverse up from survey_response_answers
) {
  const joins = buildEncounterLinkedSyncFilterJoins(tablesToTraverse);
  const where = buildEncounterLinkedSyncFilterWhere();
  return `
    ${joins}
    ${where}
  `;
}
