import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // In a previous migration (1759894448776-migrateNoteTypesToReferenceData.ts) we added a note_type_id column to the notes table.
  // We need to rebuild the notes in the lookup table for the notes table to ensure that lookup table state is correct.
  // Note that this may take a while on larger deployments, took ~15 mins on Nauru Clone
  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('notes');`);
}

export async function down(): Promise<void> {
  // No reverse migration
}
