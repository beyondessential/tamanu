import { QueryTypes } from 'sequelize';
import config from 'config';

const ISO9075_DATE_TIME_FMT = 'YYYY-MM-DD HH24:MI:SS';
const ISO9075_DATE_FMT = 'YYYY-MM-DD';

// Date time table columns that have been migrated so far (excluding lab requests)
const dateTimeTableColumns = {
  patients: ['date_of_death'],
  appointments: ['start_time', 'end_time'],
  triages: ['arrival_time', 'triage_time', 'closed_time'],
};

// Date table columns that have been migrated so far
const dateTableColumns = {
  invoice_line_items: ['date_generated'],
  invoices: ['date'],
  invoice_price_change_items: ['date'],
  patient_death_data: ['external_cause_date', 'last_surgery_date'],
};

const allColumns = [...Object.entries(dateTimeTableColumns), ...Object.entries(dateTableColumns)];

export async function up(query) {
  let count = 0;

  for (const [tableName, columns] of allColumns) {
    const where = columns.map(col => `${col}_legacy IS NOT NULL`).join(' OR ');
    const countResult = await query.sequelize.query(
      `SELECT COUNT(*) FROM ${tableName} WHERE ${where};`,
      {
        type: QueryTypes.SELECT,
      },
    );
    count += parseInt(countResult[0].count);
  }

  // If there is no legacy column data, then we don't need to run the migration or check
  // for the timezone in the config
  if (count === 0) {
    return;
  }

  const COUNTRY_TIMEZONE = config?.countryTimeZone;

  if (!COUNTRY_TIMEZONE) {
    throw Error('A countryTimeZone must be configured in local.json for this migration to run.');
  }

  const promises = [];

  // Migrate date_time_string columns
  // only include data that still matches the legacy column
  Object.entries(dateTimeTableColumns).forEach(([tableName, columns]) => {
    columns.forEach(columnName => {
      promises.push(
        query.sequelize.query(
          `UPDATE ${tableName}
           SET ${columnName} = TO_CHAR(${columnName}_legacy::TIMESTAMPTZ AT TIME ZONE '${COUNTRY_TIMEZONE}', :dateTimeFmt)
           WHERE ${columnName} = TO_CHAR(${columnName}_legacy::TIMESTAMPTZ AT TIME ZONE 'UTC', :dateTimeFmt);
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

  // Migrate date_string columns
  // only include data that still matches the legacy column
  Object.entries(dateTableColumns).forEach(([tableName, columns]) => {
    columns.forEach(columnName => {
      promises.push(
        query.sequelize.query(
          `UPDATE ${tableName}
           SET ${columnName} = TO_CHAR(${columnName}_legacy::TIMESTAMPTZ AT TIME ZONE '${COUNTRY_TIMEZONE}', :dateFmt)
           WHERE ${columnName} = TO_CHAR(${columnName}_legacy::TIMESTAMPTZ AT TIME ZONE 'UTC', :dateFmt);
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
