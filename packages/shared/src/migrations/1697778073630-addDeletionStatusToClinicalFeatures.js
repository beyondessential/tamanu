import Sequelize from 'sequelize';

const tables = [
  'encounters',
  'document_metadata',
  'referrals',
  'notes',
  'encounter_medications',
  'invoices',
  'vitals',
  'procedures',
  'lab_requests',
  'imaging_requests',
  'survey_responses',
];

export async function up(query) {
  for (const table of tables) {
    await query.addColumn(table, 'deletion_status', {
      type: Sequelize.STRING,
      defaultValue: null,
      allowNull: true,
    });
  }
}

export async function down(query) {
  for (const table of tables) {
    await query.removeColumn(table, 'deletion_status');
  }
}
