export async function up(query) {
  await query.addColumn('certificate_notifications', 'printed_date', {
    type: 'date_string',
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('certificate_notifications', 'printed_date');
}
