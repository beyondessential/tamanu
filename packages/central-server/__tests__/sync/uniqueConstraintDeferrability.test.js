import { SYNC_DIRECTIONS } from '@tamanu/constants';

import { createTestContext } from '../utilities';

// See TAM-7004. Intentionally left non-deferrable, and excluded from this check:
// - id-only unique constraints: id is the sync discriminator, so a duplicate indicates
//   a real bug rather than the benign rename/reuse ordering issue this migration
//   targets. patient_program_registrations_id_key is also a foreign key target, so
//   converting it would require dropping and recreating the referencing FK too.
// - partial/expression unique indexes: Postgres cannot make these DEFERRABLE at all —
//   only a plain (full-table, column-list-only) UNIQUE constraint or an
//   EXCLUDE ... USING gist constraint supports DEFERRABLE. Converting these needs the
//   btree_gist extension and is left for a follow-up ticket.
// - constraints/indexes relied on as an ON CONFLICT arbiter: Postgres forbids deferrable
//   constraints as ON CONFLICT arbiters. patient_facilities_patient_id_facility_id_key
//   backs an ON CONFLICT DO NOTHING; a WHERE NOT EXISTS rewrite avoids the Postgres
//   restriction but introduces a real check-then-insert race under concurrent encounter
//   creation for the same patient+facility pairing (confirmed via existing tests that
//   create encounters concurrently), so it's left non-deferrable rather than accepting
//   that trade-off. (sync_lookup's equivalent constraint has the same ON CONFLICT DO
//   UPDATE issue invoice_items used to have, but doesn't need whitelisting here —
//   SyncLookup's syncDirection is DO_NOT_SYNC, so it's never in the syncable-tables set
//   this test scans in the first place.)
const EXCLUDED_FROM_DEFERRABLE_UNIQUE_CHECK = [
  'ai_documents_id_key',
  'patient_ongoing_prescriptions_id_key',
  'patient_program_registrations_id_key',
  'idx_patient_invoice_insurance_plans_patient_id_invoice_insuranc',
  'permissions_role_id_noun_verb',
  'permissions_role_id_noun_verb_object_id',
  'settings_alive_key_unique_with_facility_idx',
  'settings_alive_key_unique_without_facility_idx',
  'user_preferences_unique_with_facility_id',
  'patient_facilities_patient_id_facility_id_key',
];

describe('Unique constraints on syncable tables must be DEFERRABLE', () => {
  let ctx;
  let models;
  let sequelize;

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models, sequelize } = ctx.store);
  });

  afterAll(() => ctx.close());

  it('all unique constraints and indexes on syncable tables are deferrable, except an explicit whitelist', async () => {
    const syncableTables = Object.values(models)
      .filter(
        m =>
          m.tableName &&
          m.usesPublicSchema &&
          m.syncDirection &&
          m.syncDirection !== SYNC_DIRECTIONS.DO_NOT_SYNC,
      )
      .map(m => m.tableName);

    if (syncableTables.length === 0) {
      throw new Error('No syncable tables found — check test setup');
    }

    const [nonDeferrableConstraints] = await sequelize.query(
      `
      SELECT con.conname AS name, cl.relname AS table_name
      FROM pg_constraint con
      JOIN pg_class cl ON con.conrelid = cl.oid
      JOIN pg_namespace n ON cl.relnamespace = n.oid
      WHERE con.contype = 'u'
        AND n.nspname = 'public'
        AND cl.relname IN (:syncableTables)
        AND NOT (con.condeferrable AND NOT con.condeferred)
      `,
      { replacements: { syncableTables } },
    );

    const [unconvertedUniqueIndexes] = await sequelize.query(
      `
      SELECT ic.relname AS name, cl.relname AS table_name
      FROM pg_index i
      JOIN pg_class cl ON i.indrelid = cl.oid
      JOIN pg_class ic ON i.indexrelid = ic.oid
      JOIN pg_namespace n ON cl.relnamespace = n.oid
      WHERE i.indisunique = true
        AND n.nspname = 'public'
        AND cl.relname IN (:syncableTables)
        AND NOT EXISTS (SELECT 1 FROM pg_constraint con WHERE con.conindid = i.indexrelid)
      `,
      { replacements: { syncableTables } },
    );

    const invalid = [...nonDeferrableConstraints, ...unconvertedUniqueIndexes].filter(
      row => !EXCLUDED_FROM_DEFERRABLE_UNIQUE_CHECK.includes(row.name),
    );

    if (invalid.length > 0) {
      const details = invalid.map(row => `  ${row.table_name}.${row.name}`).join('\n');
      throw new Error(
        `Unique constraints/indexes on syncable tables must be DEFERRABLE INITIALLY IMMEDIATE.\n` +
          `The following are not:\n${details}\n\n` +
          `Add a migration with: ALTER TABLE <table> DROP CONSTRAINT <name>; (or DROP INDEX <name>;)\n` +
          `ALTER TABLE <table> ADD CONSTRAINT <name> UNIQUE (<columns>) DEFERRABLE INITIALLY IMMEDIATE;\n\n` +
          `If it genuinely can't be made deferrable (partial/expression index, or an id-only ` +
          `constraint that should stay strict), add it to EXCLUDED_FROM_DEFERRABLE_UNIQUE_CHECK ` +
          `in this test with a comment explaining why.`,
      );
    }
  });
});
