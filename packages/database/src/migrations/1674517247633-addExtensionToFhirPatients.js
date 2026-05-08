const TABLE = { schema: 'fhir', tableName: 'patients' };

export async function up(query) {
  await query.addColumn(TABLE, 'extension', {
    type: 'fhir.extension[]',
    allowNull: false,
    defaultValue: '{}',
  });
}

export async function down(query) {
  await query.removeColumn(TABLE, 'extension');
}
