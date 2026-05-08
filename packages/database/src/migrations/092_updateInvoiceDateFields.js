import { DataTypes } from 'sequelize';

const ISO9075_DATE_FMT = 'YYYY-MM-DD';
const INVOICES_TABLE = 'invoices';
const LINE_ITEMS_TABLE = 'invoice_line_items';
const PRICE_CHANGE_ITEMS_TABLE = 'invoice_price_change_items';

export async function up(query) {
  // 1. Create legacy columns
  await query.addColumn(INVOICES_TABLE, 'date_legacy', {
    type: DataTypes.DATE,
  });
  await query.addColumn(LINE_ITEMS_TABLE, 'date_generated_legacy', {
    type: DataTypes.DATE,
  });
  await query.addColumn(PRICE_CHANGE_ITEMS_TABLE, 'date_legacy', {
    type: DataTypes.DATE,
  });

  // 2. Copy data to legacy columns for backup
  await query.sequelize.query(`
    UPDATE ${INVOICES_TABLE}
    SET
      date_legacy = date;
  `);
  await query.sequelize.query(`
    UPDATE ${LINE_ITEMS_TABLE}
    SET
        date_generated_legacy = date_generated;
  `);
  await query.sequelize.query(`
    UPDATE ${PRICE_CHANGE_ITEMS_TABLE}
    SET
      date_legacy = date;
  `);

  // 3.Change column types from of original columns from date to string & convert data to string
  await query.sequelize.query(`
    ALTER TABLE ${INVOICES_TABLE}
    ALTER COLUMN date TYPE date_string USING TO_CHAR(date, '${ISO9075_DATE_FMT}');
  `);
  await query.sequelize.query(`
    ALTER TABLE ${LINE_ITEMS_TABLE}
    ALTER COLUMN date_generated TYPE date_string USING TO_CHAR(date_generated, '${ISO9075_DATE_FMT}');
  `);
  await query.sequelize.query(`
    ALTER TABLE ${PRICE_CHANGE_ITEMS_TABLE}
    ALTER COLUMN date TYPE date_string USING TO_CHAR(date, '${ISO9075_DATE_FMT}');
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    ALTER TABLE ${INVOICES_TABLE}
    ALTER COLUMN date TYPE timestamp with time zone USING date_legacy;
  `);
  await query.sequelize.query(`
    ALTER TABLE ${LINE_ITEMS_TABLE}
    ALTER COLUMN date_generated TYPE timestamp with time zone USING date_generated_legacy;
  `);
  await query.sequelize.query(`
    ALTER TABLE ${PRICE_CHANGE_ITEMS_TABLE}
    ALTER COLUMN date TYPE timestamp with time zone USING date_legacy;
  `);
  await query.removeColumn(INVOICES_TABLE, 'date_legacy');
  await query.removeColumn(LINE_ITEMS_TABLE, 'date_generated_legacy');
  await query.removeColumn(PRICE_CHANGE_ITEMS_TABLE, 'date_legacy');
}
