export async function up(query) {
  await query.sequelize.transaction(async transaction => {
    await query.renameTable('lab_test_panels', 'lab_panels', { transaction });

    await query.renameTable('lab_test_panel_lab_test_types', 'lab_panel_lab_test_types', {
      transaction,
    });
    await query.renameColumn('lab_panel_lab_test_types', 'lab_test_panel_id', 'lab_panel_id', {
      transaction,
    });

    await query.renameTable('lab_test_panel_requests', 'lab_panel_requests', { transaction });
    await query.renameColumn('lab_panel_requests', 'lab_test_panel_id', 'lab_panel_id', {
      transaction,
    });
  });
}

export async function down(query) {
  await query.sequelize.transaction(async transaction => {
    await query.renameTable('lab_panels', 'lab_test_panels', { transaction });

    await query.renameTable('lab_panel_lab_test_types', 'lab_test_panel_lab_test_types', {
      transaction,
    });
    await query.renameColumn('lab_test_panel_lab_test_types', 'lab_panel_id', 'lab_test_panel_id', {
      transaction,
    });

    await query.renameTable('lab_panel_requests', 'lab_test_panel_requests', { transaction });
    await query.renameColumn('lab_test_panel_requests', 'lab_panel_id', 'lab_test_panel_id', {
      transaction,
    });
  });
}
