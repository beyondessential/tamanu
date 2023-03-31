import Sequelize from 'sequelize';

export async function up(query) {
  await query.sequelize.query(
    `
    ALTER TABLE lab_test_panel_lab_test_types DROP CONSTRAINT lab_test_panel_lab_test_types_pkey;
    ALTER TABLE lab_test_panel_lab_test_types ADD PRIMARY KEY (lab_test_panel_id, lab_test_type_id);
  `,
  );
  await query.removeColumn('lab_test_panel_lab_test_types', 'id');
  await query.addColumn('lab_test_panel_lab_test_types', 'id', {
    type: Sequelize.TEXT,
  });
  await query.sequelize.query(
    `UPDATE lab_test_panel_lab_test_types SET id = CONCAT(lab_test_panel_id, ';', lab_test_type_id)`,
  );
}

export async function down(query) {
  await query.removeColumn('lab_test_panel_lab_test_types', 'id');
  await query.addColumn('lab_test_panel_lab_test_types', 'id', {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: Sequelize.fn('uuid_generate_v4'),
  });
  await query.sequelize.query(`
    ALTER TABLE lab_test_panel_lab_test_types DROP CONSTRAINT lab_test_panel_lab_test_types_pkey;
    ALTER TABLE lab_test_panel_lab_test_types ADD PRIMARY KEY (id);
  `);
}
