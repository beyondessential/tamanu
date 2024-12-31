const ISO9075_DATE_TIME_FMT = 'YYYY-MM-DD HH24:MI:SS';

const dateTimeTableColumns = {
  encounter_diagnoses: ['date'],
  encounter_medications: ['date', 'end_date'],
  encounters: ['start_date', 'end_date'],
  vitals: ['date_recorded'],
  procedures: ['date'],
  note_items: ['date'],
  note_pages: ['date'],
  imaging_requests: ['requested_date'],
  administered_vaccines: ['date'],
};

export async function up(query) {
  const promises = [];

  // Original migrations where written without timestampz at time zone utc
  Object.entries(dateTimeTableColumns).forEach(([tableName, columns]) => {
    columns.forEach(columnName => {
      promises.push(
        query.sequelize.query(
          `UPDATE ${tableName}
        SET ${columnName} = TO_CHAR(${columnName}_legacy::TIMESTAMPTZ AT TIME ZONE 'UTC', :dateTimeFmt)
        WHERE ${columnName} = TO_CHAR(${columnName}_legacy, :dateTimeFmt);
        `,
          {
            replacements: {
              dateTimeFmt: ISO9075_DATE_TIME_FMT,
            },
          },
        ),
      );
    });
  });
  await Promise.all(promises);
}

export async function down() {
  // No down as is a data correction
  return null;
}
