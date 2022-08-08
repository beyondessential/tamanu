import { DATE, DATEONLY, QueryInterface, AbstractDataTypeConstructor } from 'sequelize';
import {
  ISO9075_DATETIME_FORMAT,
  ISO9075_DATETIME_FORMAT_LENGTH,
  ISO9075_DATE_FORMAT_LENGTH,
  ISO9075_DATE_FORMAT,
} from '../../constants';

/** @internal mostly internal, but occasionally useful for specific things */
export function upMigration(
  legacyType: AbstractDataTypeConstructor,
  format: string,
  length: number,
) {
  return async function(query: QueryInterface, tableName: string, columnName: string) {
    // 1. Create legacy columns
    await query.addColumn(tableName, `${columnName}_legacy`, {
      type: legacyType,
    });

    // 2. Copy data to legacy columns for backup
    await query.sequelize.query(`UPDATE ${tableName} SET ${columnName}_legacy = ${columnName};`);

    // 3.Change column types from of original columns from date to string & convert data to string
    await query.sequelize.query(
      `ALTER TABLE ${tableName}
        ALTER COLUMN ${columnName} TYPE CHAR(${length})
        USING TO_CHAR(${columnName}, '${format}');`,
    );
  };
}

export const createDateTimeStringUpMigration = upMigration(
  DATE,
  ISO9075_DATETIME_FORMAT,
  ISO9075_DATETIME_FORMAT_LENGTH,
);
export const createDateStringUpMigration = upMigration(
  DATEONLY,
  ISO9075_DATE_FORMAT,
  ISO9075_DATE_FORMAT_LENGTH,
);

/** @internal mostly internal, but occasionally useful for specific things */
export function downMigration(legacyType: string) {
  return async function(query: QueryInterface, tableName: string, columnName: string) {
    // 1. Clear data from string column
    await query.sequelize.query(
      `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE ${legacyType} USING ${columnName}_legacy;`,
    );

    // 2. Remove legacy columns
    await query.removeColumn(tableName, `${columnName}_legacy`);
  };
}

export const createDateTimeStringDownMigration = downMigration('timestamp with time zone');
export const createDateStringDownMigration = downMigration('date');
