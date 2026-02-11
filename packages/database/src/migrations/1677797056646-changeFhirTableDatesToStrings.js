import { DataTypes } from 'sequelize';
import config from 'config';

const TABLES = {
  patients: {
    birth_date: DataTypes.DATESTRING,
    deceased_date_time: DataTypes.DATESTRING,
  },
  service_requests: {
    occurrence_date_time: DataTypes.DATE,
  },
  diagnostic_reports: {
    effective_date_time: DataTypes.DATE,
    issued: DataTypes.DATE,
  },
  immunizations: {
    occurrence_date_time: DataTypes.DATETIMESTRING,
  },
};

// DATE cast will be kept/changed to whatever timezone is set in the config.
// DATETIMESTRING cast will assume that's the correct one.
export async function up(query) {
  const GLOBAL_TIME_ZONE = config?.globalTimeZone;

  if (!GLOBAL_TIME_ZONE) {
    throw Error('A globalTimeZone must be configured in local.json5 for this migration to run.');
  }

  // Save previously set time zone
  const previousTimeZoneQuery = await query.sequelize.query('show timezone');
  const previousTimeZone = previousTimeZoneQuery[0].TimeZone;

  // Set time zone defined in config
  await query.sequelize.query(`SET timezone to '${GLOBAL_TIME_ZONE}'`);

  for (const [tableName, columns] of Object.entries(TABLES)) {
    for (const [columnName, columnType] of Object.entries(columns)) {
      if (columnType === DataTypes.DATE) {
        await query.sequelize.query(`
          ALTER TABLE fhir.${tableName}
            ALTER COLUMN ${columnName}
              TYPE TEXT
                USING to_json(${columnName})#>>'{}'
        `);
      } else if (columnType === DataTypes.DATETIMESTRING) {
        await query.sequelize.query(`
          ALTER TABLE fhir.${tableName}
            ALTER COLUMN ${columnName}
              TYPE TEXT
                USING to_json(to_timestamp(${columnName}, 'YYYY-MM-DD hh24:mi:ss'))#>>'{}'
        `);
      } else {
        await query.sequelize.query(`
          ALTER TABLE fhir.${tableName}
            ALTER COLUMN ${columnName}
              TYPE TEXT
        `);
      }
    }
  }

  // Reset time zone for containment
  await query.sequelize.query(`SET timezone to '${previousTimeZone}'`);
}

// Down migration will get rid of all data, which
// essentially means that downtime will be needed to wait for
// rematerialisation.
export async function down(query) {
  for (const [tableName, columns] of Object.entries(TABLES)) {
    await query.sequelize.query(`TRUNCATE TABLE fhir.${tableName}`);

    const table = { schema: 'fhir', tableName };
    for (const [columnName, columnType] of Object.entries(columns)) {
      await query.removeColumn(table, columnName);
      await query.addColumn(table, columnName, {
        type: columnType,
      });
    }
  }
}
