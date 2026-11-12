import { QueryTypes, type QueryInterface } from 'sequelize';

const OLD_TABLE = 'invoice_insurer_payments';
const NEW_TABLE = 'invoice_insurance_plan_payments';

// Renaming a table keeps its triggers under their old names, and the post-migration hooks find a
// table's triggers by names built from the table name. Left alone, the hooks would add a second
// changelog, updated_at and sync tick trigger beside the old ones, so rename them to match.
async function renameTriggers(query: QueryInterface, table: string, from: string, to: string) {
  const triggers = await query.sequelize.query<{ name: string }>(
    `
      SELECT t.tgname AS name
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = $table
        AND NOT t.tgisinternal
        AND position($from IN t.tgname) > 0
    `,
    { bind: { table, from }, type: QueryTypes.SELECT },
  );

  for (const { name } of triggers) {
    await query.sequelize.query(
      `ALTER TRIGGER "${name}" ON "public"."${table}" RENAME TO "${name.replace(from, to)}"`,
    );
  }
}

export async function up(query: QueryInterface): Promise<void> {
  await query.renameTable(OLD_TABLE, NEW_TABLE);
  await renameTriggers(query, NEW_TABLE, OLD_TABLE, NEW_TABLE);
  await query.renameColumn('invoices', 'insurer_payment_status', 'insurance_plan_payment_status');
}

export async function down(query: QueryInterface): Promise<void> {
  await query.renameTable(NEW_TABLE, OLD_TABLE);
  await renameTriggers(query, OLD_TABLE, NEW_TABLE, OLD_TABLE);
  await query.renameColumn('invoices', 'insurance_plan_payment_status', 'insurer_payment_status');
}
