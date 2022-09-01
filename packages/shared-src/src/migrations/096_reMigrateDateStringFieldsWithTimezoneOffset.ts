import { QueryInterface } from 'sequelize';

// This is the correct format for postgres date_time_string fields
const ISO9075_DATE_TIME_FMT = 'YYYY-MM-DD HH24:MI:SS';
// This is the date format that was incorrectly used for first round of date migrations
const JAVASCRIPT_ISO9075_DATE_TIME_FMT = 'YYYY-MM-DD HH:mm:ss';

// Table columns that have been migrated so far
const tableColumns = {
  patients: ['date_of_death'],
  appointments: ['start_time', 'end_time'],
  triages: ['arrival_time', 'triage_time', 'closed_time'],
  lab_requests: ['sample_time', 'requested_date'],
};

export async function up(query: QueryInterface) {
  const promises = [];
  Object.entries(tableColumns).forEach(([tableName, columns]) => {
    columns.forEach(columnName => {
      promises.push(
        query.sequelize.query(`UPDATE ${tableName}
        SET ${columnName} = to_char(${columnName}_legacy::TIMESTAMPTZ AT TIME ZONE 'UTC', ${ISO9075_DATE_TIME_FMT})
        WHERE ${columnName} = to_char(${columnName}_legacy, ${ISO9075_DATE_TIME_FMT})
        OR ${columnName} = to_char(${columnName}_legacy, ${JAVASCRIPT_ISO9075_DATE_TIME_FMT});
        `),
      );
    });
  });
  await Promise.all(promises);
}

export async function down() {
  // No down as is a data correction
  return null;
}
