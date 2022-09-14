import { QueryRunner, Table, TableColumn } from 'typeorm';

// typeORM uses a PRAGMA table_xinfo when getting a tables column definitions
// This doesn't work on android, so typeORM thinks there's no columns defined
// so redo the column loading with a regular table_info
export async function getTable(
  queryRunner: QueryRunner,
  tableName: string,
): Promise<Table> {
  const tableObject = await queryRunner.getTable(tableName);
  const tableColumns = await queryRunner.query(`PRAGMA table_info('${tableName}');`);

  // NOTE: This logic is plucked from typeORM
  // https://github.com/typeorm/typeorm/blob/51b2a63d/src/driver/sqlite-abstract/AbstractSqliteQueryRunner.ts#L721
  // create columns from the loaded columns
  tableObject.columns = tableColumns.map(dbColumn => {
    const tableColumn = new TableColumn();
    tableColumn.name = dbColumn.name;
    tableColumn.type = dbColumn.type.toLowerCase();
    tableColumn.default = dbColumn.dflt_value !== null
      && dbColumn.dflt_value !== undefined
      ? dbColumn.dflt_value : undefined;
    tableColumn.isNullable = dbColumn.notnull === 0;
    // primary keys are numbered starting with 1, columns that aren't primary keys are marked with 0
    tableColumn.isPrimary = dbColumn.pk > 0;
    tableColumn.comment = ''; // SQLite does not support column comments
    tableColumn.isGenerated = false;

    // parse datatype and attempt to retrieve length
    const pos = tableColumn.type.indexOf('(');
    if (pos !== -1) {
      const dataType = tableColumn.type.substr(0, pos);
      if (queryRunner.driver.withLengthColumnTypes.find(col => col === dataType)) {
        const len = parseInt(tableColumn.type.substring(pos + 1, tableColumn.type.length - 1), 10);
        if (len) {
          tableColumn.length = len.toString();
          tableColumn.type = dataType; // remove the length part from the datatype
        }
      }
    }
    return tableColumn;
  });

  return tableObject;
};
