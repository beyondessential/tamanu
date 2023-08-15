export async function up(query) {
  await query.sequelize.query(
    'ALTER INDEX IF EXISTS lab_test_panels_updated_at_sync_tick_index RENAME TO lab_panels_updated_at_sync_tick_index;',
  );
  await query.sequelize.query(
    'DROP TRIGGER IF EXISTS set_lab_test_panels_updated_at_sync_tick ON lab_test_panels;',
  );
  await query.sequelize.query(
    'ALTER INDEX IF EXISTS lab_test_panels_pkey RENAME TO lab_panels_pkey;',
  );
  await query.renameTable('lab_test_panels', 'lab_panels');
  await query.sequelize.query(
    'ALTER INDEX IF EXISTS lab_test_panel_lab_test_types_updated_at_sync_tick_index RENAME TO lab_panel_lab_test_types_updated_at_sync_tick_index;',
  );
  await query.sequelize.query(
    'DROP TRIGGER IF EXISTS set_lab_test_panel_lab_test_types_updated_at_sync_tick on lab_test_panel_lab_test_types;',
  );
  await query.sequelize.query(
    'ALTER INDEX IF EXISTS  lab_test_panel_lab_test_types_pkey RENAME TO lab_panel_lab_test_types_pkey;',
  );
  await query.renameTable('lab_test_panel_lab_test_types', 'lab_panel_lab_test_types');
  await query.renameColumn('lab_panel_lab_test_types', 'lab_test_panel_id', 'lab_panel_id');
  await query.sequelize.query(
    'ALTER INDEX IF EXISTS lab_test_panel_requests_updated_at_sync_tick_index RENAME TO lab_panel_requests_updated_at_sync_tick_index;',
  );
  await query.sequelize.query(
    'DROP TRIGGER IF EXISTS set_lab_test_panel_requests_updated_at_sync_tick on lab_test_panel_requests;',
  );
  await query.sequelize.query(
    'ALTER INDEX IF EXISTS lab_test_panel_requests_pkey RENAME TO lab_panel_requests_pkey;',
  );
  await query.renameTable('lab_test_panel_requests', 'lab_panel_requests');
  await query.renameColumn('lab_panel_requests', 'lab_test_panel_id', 'lab_panel_id');
  await query.renameColumn('lab_requests', 'lab_test_panel_request_id', 'lab_panel_request_id');
}

export async function down(query) {
  await query.renameColumn('lab_requests', 'lab_panel_request_id', 'lab_test_panel_request_id');
  await query.renameColumn('lab_panel_requests', 'lab_panel_id', 'lab_test_panel_id');
  await query.sequelize.query(
    'ALTER INDEX IF EXISTS lab_panel_requests_updated_at_sync_tick_index RENAME TO lab_test_panel_requests_updated_at_sync_tick_index;',
  );
  await query.sequelize.query(
    'DROP TRIGGER IF EXISTS set_lab_panel_requests_updated_at_sync_tick on lab_panel_requests;',
  );
  await query.sequelize.query(
    'ALTER INDEX IF EXISTS lab_panel_requests_pkey RENAME TO lab_test_panel_requests_pkey;',
  );
  await query.renameTable('lab_panel_requests', 'lab_test_panel_requests');
  await query.renameColumn('lab_panel_lab_test_types', 'lab_panel_id', 'lab_test_panel_id');
  await query.sequelize.query(
    'ALTER INDEX IF EXISTS lab_panel_lab_test_types_updated_at_sync_tick_index RENAME TO lab_test_panel_lab_test_types_updated_at_sync_tick_index;',
  );
  await query.sequelize.query(
    'DROP TRIGGER IF EXISTS set_lab_panel_lab_test_types_updated_at_sync_tick on lab_panel_lab_test_types;',
  );
  await query.sequelize.query(
    'ALTER INDEX IF EXISTS lab_panel_lab_test_types_pkey RENAME TO lab_test_panel_lab_test_types_pkey;',
  );
  await query.renameTable('lab_panel_lab_test_types', 'lab_test_panel_lab_test_types');
  await query.sequelize.query(
    'ALTER INDEX IF EXISTS lab_panels_updated_at_sync_tick_index RENAME TO lab_test_panels_updated_at_sync_tick_index;',
  );
  await query.sequelize.query(
    'DROP TRIGGER IF EXISTS set_lab_panels_updated_at_sync_tick on lab_panels;',
  );
  await query.sequelize.query(
    'ALTER INDEX IF EXISTS lab_panels_pkey RENAME TO lab_test_panels_pkey;',
  );
  await query.renameTable('lab_panels', 'lab_test_panels');
}
