export async function up(query) {
  await query.sequelize.query(`
    ALTER TABLE sync_queued_devices
    ALTER COLUMN facility_id DROP NOT NULL;
  `);
  await query.renameColumn('sync_queued_devices', 'facility_id', 'facility_id_legacy');
  await query.sequelize.query(`
    ALTER TABLE sync_queued_devices
    ADD COLUMN facility_ids JSONB;

    UPDATE sync_queued_devices SET facility_ids = json_build_array(facility_id_legacy);

    ALTER TABLE sync_queued_devices
    ALTER COLUMN facility_ids SET NOT NULL;
  `);
}

export async function down(query) {
  await query.renameColumn('sync_queued_devices', 'facility_id_legacy', 'facility_id');
  await query.sequelize.query(`
    ALTER TABLE sync_queued_devices
    ALTER COLUMN facility_id SET NOT NULL;
  `);
  await query.removeColumn('sync_queued_devices', 'facility_ids');
}
