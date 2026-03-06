import { QueryTypes } from 'sequelize';
import config from 'config';

const ISO9075_DATE_TIME_FMT = 'YYYY-MM-DD HH24:MI:SS';
const ISO9075_DATE_FMT = 'YYYY-MM-DD';

// Date time table columns that have been migrated so far, excluding columns which were already
// migrated in 098_reMigrateDatesUsingCountryTimeZone.js (patients, appointments & triages)
const dateTimeTableColumns = {
  administered_vaccines: ['date'],
  encounters: ['start_date', 'end_date'],
  encounter_diagnoses: ['date'],
  encounter_medications: ['date', 'end_date'],
  imaging_requests: ['requested_date'],
  note_items: ['date'],
  note_pages: ['date'],
  patient_allergies: ['recorded_date'],
  patient_care_plans: ['date'],
  patient_conditions: ['recorded_date'],
  patient_family_histories: ['recorded_date'],
  patient_issues: ['recorded_date'],
  procedures: ['date'],
  vitals: ['date_recorded'],
};

// Date table columns that have been migrated so far
// (invoice_line_items, invoices, invoice_price_change_items, patient_death_data)
const dateTableColumns = {
  patients: ['date_of_birth'],
};
const allColumns = [...Object.entries(dateTimeTableColumns), ...Object.entries(dateTableColumns)];

// Check if there is any legacy data in the system
// For example, newly deployed instances of tamanu won't have legacy data
const checkForLegacyData = async (query) => {
  let count = 0;

  for (const [tableName, columns] of allColumns) {
    const where = columns.map((col) => `${col}_legacy IS NOT NULL`).join(' OR ');
    const countResult = await query.sequelize.query(
      `SELECT COUNT(*) FROM ${tableName} WHERE ${where};`,
      {
        type: QueryTypes.SELECT,
      },
    );
    count += parseInt(countResult[0].count);
  }
  return count;
};

export async function up(query) {
  const legacyDataCount = await checkForLegacyData(query);

  // If there is no legacy column data, then we don't need to run the migration or check
  // for the timezone in the config
  if (legacyDataCount === 0) {
    return;
  }

  const PRIMARY_TIME_ZONE = config?.primaryTimeZone;

  if (!PRIMARY_TIME_ZONE) {
    throw Error('A primaryTimeZone must be configured in local.json5 for this migration to run.');
  }

  const promises = [];

  // Re-Migrate date_time_string columns
  // Original migrations where written with timestampz at time zone utc instead of local time zone
  // only include data that still matches the legacy offset to UTC
  Object.entries(dateTimeTableColumns).forEach(([tableName, columns]) => {
    columns.forEach((columnName) => {
      promises.push(
        query.sequelize.query(
          `UPDATE ${tableName}
           SET ${columnName} = TO_CHAR(${columnName}_legacy::TIMESTAMPTZ AT TIME ZONE '${PRIMARY_TIME_ZONE}', :dateTimeFmt)
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

  // Re-Migrate date_string columns
  // Original migrations where written with timestampz at time zone utc instead of local time zone
  // Only include data that still matches the legacy offset to UTC
  Object.entries(dateTableColumns).forEach(([tableName, columns]) => {
    columns.forEach((columnName) => {
      promises.push(
        query.sequelize.query(
          `UPDATE ${tableName}
           SET ${columnName} = TO_CHAR(${columnName}_legacy::TIMESTAMPTZ AT TIME ZONE '${PRIMARY_TIME_ZONE}', :dateFmt)
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
