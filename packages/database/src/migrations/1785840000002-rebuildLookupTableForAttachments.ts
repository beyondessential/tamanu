import { QueryInterface } from 'sequelize';

// Attachments become ordinary synchronised records carrying their own patient
// scope, so every existing row needs a sync_lookup entry: the incremental build
// only picks up rows whose sync tick has advanced.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('attachments');`);
}

export async function down(): Promise<void> {
  // Nothing to undo: the rebuild flag is consumed by the next lookup build.
}
