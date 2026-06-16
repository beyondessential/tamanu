import { type QueryInterface, QueryTypes } from 'sequelize';

// Repairs rows where rules was JSON.stringify'd a second time by Sequelize's JSONB
// serialiser (i.e. stored as a JSON string literal rather than a JSON object).
// After this migration rules is always either NULL or an object; rows whose stored
// string was not parseable or not an object are reset to NULL.

export async function up(query: QueryInterface): Promise<void> {
  const rows = await query.sequelize.query<{ id: string; rules: unknown }>(
    `SELECT id, rules FROM invoice_price_lists WHERE jsonb_typeof(rules) = 'string';`,
    { type: QueryTypes.SELECT },
  );

  for (const { id, rules } of rows) {
    // The pg driver has already parsed the JSONB column, so a JSONB string comes back as a JS string.
    let fixed: Record<string, unknown> | null = null;
    if (typeof rules === 'string') {
      try {
        const parsed = JSON.parse(rules);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          fixed = parsed;
        }
      } catch {
        // leave as null — the stored string wasn't valid JSON (e.g. the spreadsheet cell was
        // a JSON fragment without outer braces). Operator needs to re-import that row.
      }
    }

    await query.sequelize.query(
      `UPDATE invoice_price_lists SET rules = :rules::jsonb WHERE id = :id;`,
      {
        type: QueryTypes.UPDATE,
        replacements: { id, rules: fixed === null ? null : JSON.stringify(fixed) },
      },
    );
  }

  // Rules is synced as part of the row payload, so rebuild the lookup entries
  // to reflect the repaired objects on the next sync pull.
  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('invoice_price_lists');`);
}

export async function down(_query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: cannot restore the original stringified form — and there is no reason to.
}
