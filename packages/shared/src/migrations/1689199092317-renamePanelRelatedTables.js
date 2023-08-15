export async function up(query) {
  await query.renameTable('lab_test_panels', 'lab_panels');
  await query.renameTable('lab_test_panel_lab_test_types', 'lab_panel_lab_test_types');
  await query.renameColumn('lab_panel_lab_test_types', 'lab_test_panel_id', 'lab_panel_id');
  await query.renameTable('lab_test_panel_requests', 'lab_panel_requests');
  await query.renameColumn('lab_panel_requests', 'lab_test_panel_id', 'lab_panel_id');
  await query.renameColumn('lab_requests', 'lab_test_panel_request_id', 'lab_panel_request_id');
}

export async function down(query) {
  await query.renameColumn('lab_requests', 'lab_panel_request_id', 'lab_test_panel_request_id');
  await query.renameColumn('lab_panel_requests', 'lab_panel_id', 'lab_test_panel_id');
  await query.renameTable('lab_panel_requests', 'lab_test_panel_requests');
  await query.renameColumn('lab_panel_lab_test_types', 'lab_panel_id', 'lab_test_panel_id');
  await query.renameTable('lab_panel_lab_test_types', 'lab_test_panel_lab_test_types');
  await query.renameTable('lab_panels', 'lab_test_panels');
}
