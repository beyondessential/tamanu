import { QueryInterface } from 'sequelize';

const PLANS = 'invoices_invoice_insurance_plans';

// Uniqueness was declared on the model but never reached the schema, and the table syncs both
// ways, so a database can already hold the same plan attached to an invoice twice — each copy
// counting its coverage again. The indexes added next cannot be created over that, so the extra
// copies are retired here, keeping the earliest of each set.
//
// Its own migration because DDL and DML cannot share one: the audit triggers queue events until
// commit, and an ALTER TABLE behind a write in the same transaction fails.
//
// sync_lookup: the sync-tick trigger is dropped during migrations, so the UPDATE bumps no
// updated_at_sync_tick and the lookup refresh would not pick these rows up. The table syncs both
// ways, so a facility holding the duplicates would go on pricing their coverage twice and could
// push them back. Flagging the model rebuilds its lookup rows from the corrected data, reusing
// each row's existing tick so clients do not re-pull. No-op on facilities, which hold no
// sync_lookup rows.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    UPDATE ${PLANS}
    SET deleted_at = NOW()
    WHERE deleted_at IS NULL
      AND id IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (
            PARTITION BY invoice_id, invoice_insurance_plan_id, invoice_section_id
            ORDER BY created_at, id
          ) AS copy
          FROM ${PLANS}
          WHERE deleted_at IS NULL
        ) ranked
        WHERE ranked.copy > 1
      )
  `);

  await query.sequelize.query(
    `SELECT flag_lookup_model_to_rebuild('invoices_invoice_insurance_plans')`,
  );
}

export async function down(): Promise<void> {
  // DESTRUCTIVE: the retired attachments are not restored. Which rows were duplicates is no
  // longer distinguishable from attachments deleted for any other reason.
}
