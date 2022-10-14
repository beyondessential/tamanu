// This is the correct format for postgres date_time_string fields
const ISO9075_DATE_TIME_FMT = 'YYYY-MM-DD HH24:MI:SS';

// This is the format for postgres date_time_string fields
const ISO9075_DATE_FMT = 'YYYY-MM-DD';

// This is the date format that was incorrectly used for first round of date migrations
const JAVASCRIPT_ISO9075_DATE_TIME_FMT = 'YYYY-MM-DD HH:mm:ss';

// Date time table columns that have been migrated so far
const dateTimeTableColumns = {
  patients: ['date_of_death'],
  appointments: ['start_time', 'end_time'],
  triages: ['arrival_time', 'triage_time', 'closed_time'],
  lab_requests: ['sample_time', 'requested_date'],
};

// Date table columns that have been migrated so far
const dateTableColumns = {
  invoice_line_items: ['date_generated'],
  invoices: ['date'],
  invoice_price_change_items: ['date'],
  patient_death_data: ['external_cause_date', 'last_surgery_date'],
};

export async function up(query) {
  const promises = [];

  // Migrate date_time_string columns
  // only include data that still matches the legacy column
  // Note there are 2 where conditions to update data was incorrectly updated twice
  // one for the first JS-date-string-in-SQL incorrect format (081_updateLabRequestDateTimeColumns),
  // and one for the second non-UTC-corrected incorrect format (093_alterDateStringFormats)
  Object.entries(dateTimeTableColumns).forEach(([tableName, columns]) => {
    columns.forEach(columnName => {
      promises.push(
        query.sequelize.query(
          `UPDATE ${tableName}
        SET ${columnName} = TO_CHAR(${columnName}_legacy::TIMESTAMPTZ AT TIME ZONE 'UTC', :dateTimeFmt)
        WHERE ${columnName} = TO_CHAR(${columnName}_legacy, :dateTimeFmt)
        OR ${columnName} = TO_CHAR(${columnName}_legacy, :oldDateTimeFmt);
        `,
          {
            replacements: {
              dateTimeFmt: ISO9075_DATE_TIME_FMT,
              oldDateTimeFmt: JAVASCRIPT_ISO9075_DATE_TIME_FMT,
            },
          },
        ),
      );
    });
  });

  // Migrate date_string columns
  // only include data that still matches the legacy column
  Object.entries(dateTableColumns).forEach(([tableName, columns]) => {
    columns.forEach(columnName => {
      promises.push(
        query.sequelize.query(
          `UPDATE ${tableName}
        SET ${columnName} = TO_CHAR(${columnName}_legacy::TIMESTAMPTZ AT TIME ZONE 'UTC', :dateFmt)
        WHERE ${columnName} = TO_CHAR(${columnName}_legacy, :dateFmt);
        `,
          {
            replacements: {
              dateFmt: ISO9075_DATE_FMT,
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
