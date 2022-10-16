import { MigrationInterface, QueryRunner } from 'typeorm';

// Date time table columns that have been migrated so far
const dateTimeTableColumns = {
  diagnosis: ['date'],
  medication: ['date', 'endDate'],
  encounter: ['startDate', 'endDate'],
  vitals: ['dateRecorded'],
  administered_vaccine: ['date'],
  patient_issue: ['recordedDate'],
  survey_response: ['startTime', 'endTime'],
  patient: ['dateOfBirth'],
};

// Date table columns that have been migrated so far
const dateTableColumns = {
  patient: ['dateOfBirth'],
  labTest: ['date'],
};

// Check if there is any legacy data in the system. For example, newly deployed instances of the app
// won't have legacy data
const checkForLegacyData = async (
  queryRunner: QueryRunner,
  tableName: string,
  columns,
): Promise<number> => {
  const where = columns.map(col => `${col} IS NOT NULL`).join(' OR ');
  const countResult = await queryRunner.query(
    `SELECT COUNT(*) as 'count' FROM ${tableName} WHERE ${where};`,
  );
  return parseInt(countResult[0].count, 10);
};

export class reMigrateDateFieldsWithCountryTimeZone1665901637000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const promises = [];

    // Re-Migrate date_time_string columns
    // Original migrations where written without setting the dates to local time. They are stored in
    // the database in utc by default. Only include data that still matches the legacy data
    for (const [tableName, columns] of Object.entries(dateTimeTableColumns)) {
      const legacyDataCount = await checkForLegacyData(queryRunner, tableName, columns);

      // If there is no legacy column data, then we don't need to run the migration
      if (legacyDataCount > 0) {
        columns.forEach(columnName => {
          promises.push(
            queryRunner.query(
              `UPDATE ${tableName}
            SET ${columnName} = datetime(${columnName}, 'localtime')
            WHERE ${columnName} = ${columnName}_legacy;`,
            ),
          );
        });
      }
    }

    // Re-Migrate date_string columns
    // Original migrations where written without setting the dates to local time. They are stored in
    // the database in utc by default. Only include data that still matches the legacy data
    for (const [tableName, columns] of Object.entries(dateTableColumns)) {
      const legacyDataCount = await checkForLegacyData(queryRunner, tableName, columns);

      // If there is no legacy column data, then we don't need to run the migration
      if (legacyDataCount > 0) {
        columns.forEach(columnName => {
          promises.push(
            queryRunner.query(
              `UPDATE ${tableName}
            SET ${columnName} = date(${columnName}, 'localtime')
            WHERE ${columnName} = ${columnName}_legacy;`,
            ),
          );
        });
      }
    }

    await Promise.all(promises);
  }

  async down(queryRunner): Promise<void> {
    const promises = [];

    for (const [tableName, columns] of Object.entries(dateTimeTableColumns)) {
      // Set each column back to utc time, if the column value still matches the legacy column
      // when converted to utc
      columns.forEach(columnName => {
        promises.push(
          queryRunner.query(
            `UPDATE ${tableName}
            SET ${columnName} = datetime(${columnName}, 'utc')
            WHERE datetime(${columnName}, 'utc') = ${columnName}_legacy;`,
          ),
        );
      });
    }

    for (const [tableName, columns] of Object.entries(dateTimeTableColumns)) {
      // Set each column back to utc time, if the column value still matches the legacy column
      // when converted to utc
      columns.forEach(columnName => {
        promises.push(
          queryRunner.query(
            `UPDATE ${tableName}
            SET ${columnName} = date(${columnName}, 'utc')
            WHERE datetime(${columnName}, 'utc') = ${columnName}_legacy;`,
          ),
        );
      });
    }

    await Promise.all(promises);
  }
}
