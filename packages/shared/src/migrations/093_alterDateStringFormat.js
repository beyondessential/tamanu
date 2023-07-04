const ISO9075_DATE_TIME_FMT_CORRECTION = 'YYYY-MM-DD HH24:MI:SS';

const tableColumns = {
  patients: ['date_of_death'],
  appointments: ['start_time', 'end_time'],
  triages: ['arrival_time', 'triage_time', 'closed_time'],
  lab_requests: ['sample_time', 'requested_date'],
};

export async function up(query) {
  const promises = [];
  Object.entries(tableColumns).forEach(([tableName, columns]) => {
    columns.forEach(columnName => {
      promises.push(
        query.sequelize.query(
          `
        UPDATE ${tableName}
        SET ${columnName} = COALESCE(TO_CHAR(${`${columnName}_legacy`}, :dateTimeFmt), ${columnName});
        `,
          {
            replacements: {
              dateTimeFmt: ISO9075_DATE_TIME_FMT_CORRECTION,
            },
          },
        ),
      );
    });
  });
  await Promise.all(promises);
}

export async function down() {
  // No down as correction
  return null;
}
