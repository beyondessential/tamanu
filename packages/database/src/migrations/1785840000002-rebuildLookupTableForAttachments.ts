import { QueryInterface } from 'sequelize';

// Every existing row needs a sync_lookup entry: the incremental build only picks up rows whose tick
// has advanced.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('attachments');`);
}

export async function down(): Promise<void> {
  // The rebuild flag is consumed by the next lookup build.
}
