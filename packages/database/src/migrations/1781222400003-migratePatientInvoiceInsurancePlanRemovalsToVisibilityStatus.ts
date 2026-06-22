import { QueryInterface } from 'sequelize';

// Removing a plan from a patient used to soft-delete its patient_invoice_insurance_plans row.
// That is replaced by a visibility_status toggle (current <-> historical), so convert any existing
// soft-deleted rows into historical, undeleted rows. This is also required for correctness: the
// remove/re-add flow now reads rows with deleted_at IS NULL, so a leftover soft-deleted row would
// be invisible to it yet still occupy the (patient_id, invoice_insurance_plan_id) primary key,
// causing a collision when that plan is re-added.
//
// DML only (no DDL), so the ALTER-after-UPDATE pending-trigger-events problem does not apply. The
// transform is deterministic and runs on every server, so it stays consistent central<->facility
// without bumping the sync tick — no re-pull.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    UPDATE patient_invoice_insurance_plans
    SET visibility_status = 'historical',
        deleted_at = NULL
    WHERE deleted_at IS NOT NULL;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: the original deleted_at timestamps are not preserved. Historical rows are
  // re-soft-deleted with the current timestamp to approximate the previous representation.
  await query.sequelize.query(`
    UPDATE patient_invoice_insurance_plans
    SET deleted_at = current_timestamp
    WHERE visibility_status = 'historical';
  `);
}
