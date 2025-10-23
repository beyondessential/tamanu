import { QueryTypes, QueryInterface } from 'sequelize';

/*
  Migration: Rename all tables starting with 'invoice' to be prefixed with 'finance_'
  This will transform e.g. invoice_items -> finance_invoice_items
*/

const TABLES = [
  'invoice_discounts',
  'invoice_insurer_payments',
  'invoice_insurers',
  'invoice_item_discounts',
  'invoice_items',
  'invoice_patient_payments',
  'invoice_payments',
  'invoice_price_list_items',
  'invoice_price_lists',
  'invoice_products',
  'invoices',
];

async function tableExists(query: QueryInterface, tableName: string): Promise<boolean> {
  const [result] = await query.sequelize.query(
    `select exists (
      select 1 from information_schema.tables
      where table_schema = 'public'
        and table_name = :tableName
    ) as exists;`,
    { replacements: { tableName }, type: QueryTypes.SELECT },
  );
  return (result as { exists: boolean })?.exists ?? false;
}

export async function up(query: QueryInterface): Promise<void> {
  for (const tableName of TABLES) {
    const newName = `finance_${tableName}`;

    if (!(await tableExists(query, tableName))) {
      // Source doesn't exist; skip
      continue;
    }

    if (await tableExists(query, newName)) {
      // Destination already exists; assume already renamed
      continue;
    }

    await query.sequelize.query(`alter table public.${tableName} rename to ${newName};`);
  }
}

export async function down(query: QueryInterface): Promise<void> {
  for (const oldName of TABLES) {
    const financeName = `finance_${oldName}`;

    if (!(await tableExists(query, financeName))) {
      continue;
    }

    if (await tableExists(query, oldName)) {
      // If the original table still exists, skip to avoid collision
      continue;
    }

    await query.sequelize.query(`alter table public.${financeName} rename to ${oldName};`);
  }
}
