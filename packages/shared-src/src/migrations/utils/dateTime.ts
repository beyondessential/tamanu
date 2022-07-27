import { DATE, QueryInterface } from 'sequelize';
import { ISO9075_FORMAT, ISO9075_FORMAT_LENGTH } from '../../constants';

export async function createDateTimeStringUpMigration(
  query: QueryInterface,
  tableName: string,
  columnName: string,
) {
  // 1. Create legacy columns
  await query.addColumn(tableName, `${columnName}_legacy`, {
    type: DATE,
  });

  // 2. Copy data to legacy columns for backup
  await query.sequelize.query(`UPDATE ${tableName} SET ${columnName}_legacy = ${columnName};`);

  // 3.Change column types from of original columns from date to string & convert data to string
  await query.sequelize.query(
    `ALTER TABLE ${tableName}
       ALTER COLUMN ${columnName} TYPE CHAR(${ISO9075_FORMAT_LENGTH})
       USING TO_CHAR(${columnName}, '${ISO9075_FORMAT}');`,
  );
}

export async function createDateTimeStringDownMigration(
  query: QueryInterface,
  tableName: string,
  columnName: string,
) {
  // 1. Clear data from string column
  await query.sequelize.query(
    `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE timestamp with time zone USING ${columnName}_legacy;`,
  );

  // 2. Remove legacy columns
  await query.removeColumn(tableName, `${columnName}_legacy`);
}
