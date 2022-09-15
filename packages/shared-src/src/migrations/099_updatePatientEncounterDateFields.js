import { DataTypes } from 'sequelize';

const ISO9075_DATE_TIME = 'YYYY-MM-DD HH24:MI:SS';

async function updateTableColumn(query, table, column) {
  // 1. Create legacy column
  await query.addColumn(table, `${column}_legacy`, {
    type: DataTypes.DATE,
  });

  // 2. Copy data to legacy columns for backup
  await query.sequelize.query(`
    UPDATE ${table}
    SET
      ${column}_legacy = ${column};
  `);

  // 3.Change column types from of original columns from date to string & convert data to string
  await query.sequelize.query(`
    ALTER TABLE ${table} 
    ALTER COLUMN ${column} TYPE date_time_string USING TO_CHAR(${column}, '${ISO9075_DATE_TIME}');
  `);
}

async function downdateTableColumn(query, table, column) {
  await query.sequelize.query(`
    ALTER TABLE ${table}
    ALTER COLUMN ${column} TYPE timestamp with time zone USING ${column}_legacy;
  `);
  await query.removeColumn(table, `${column}_legacy`);
}

export async function up(query) {
  await updateTableColumn(query, 'encounter_diagnoses', 'date');
  await updateTableColumn(query, 'encounter_medications', 'date');
  await updateTableColumn(query, 'encounter_medications', 'end_date');
  await updateTableColumn(query, 'encounters', 'start_date');
  await updateTableColumn(query, 'encounters', 'end_date');
  await updateTableColumn(query, 'vitals', 'date_recorded');
  await updateTableColumn(query, 'procedures', 'date');
  await updateTableColumn(query, 'note_items', 'date');
  await updateTableColumn(query, 'note_pages', 'date');
  await updateTableColumn(query, 'imaging_requests', 'requested_date');
  await updateTableColumn(query, 'administered_vaccines', 'date');
}

export async function down(query) {
  await downdateTableColumn(query, 'encounter_diagnoses', 'date');
  await downdateTableColumn(query, 'encounter_medications', 'date');
  await downdateTableColumn(query, 'encounter_medications', 'end_date');
  await downdateTableColumn(query, 'encounters', 'start_date');
  await downdateTableColumn(query, 'encounters', 'end_date');
  await downdateTableColumn(query, 'vitals', 'date_recorded');
  await downdateTableColumn(query, 'procedures', 'date');
  await downdateTableColumn(query, 'note_items', 'date');
  await downdateTableColumn(query, 'note_pages', 'date');
  await downdateTableColumn(query, 'imaging_requests', 'requested_date');
  await downdateTableColumn(query, 'administered_vaccines', 'date');
}
