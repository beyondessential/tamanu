import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(
    `
      UPDATE permissions
      SET id = REPLACE(id, 'encountermedication', 'medication')
      WHERE id LIKE '%encountermedication%'
      AND noun = 'Medication';
    `,
  );
}

export async function down(): Promise<void> {
  // It's not possible to reverse the migration to its original state,
  //
  // An edge case:
  // practitioner.medication.read.any (noun = 'Medication')
  // admin.encountermedication.write.any (noun = 'Medication')
  //
  // After up:
  // practitioner.medication.read.any (unchanged - doesn't contain 'encountermedication')
  // admin.medication.write.any (changed from 'encountermedication' -> 'medication')
  //
  // After down:
  // practitioner.encountermedication.read.any (WRONG! This was never 'encountermedication')
  // admin.encountermedication.write.any (correct reversal)
  //
  // This is an edge case that we can't reverse. So leaving down migration empty.
}
