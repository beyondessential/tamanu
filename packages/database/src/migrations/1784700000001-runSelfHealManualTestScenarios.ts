import { QueryInterface } from 'sequelize';

// MANUAL TEST MIGRATION — not a permanent data change. See createSelfHealManualTestFixtures (the
// DDL migration immediately before this one) for context and the query to review the outcome.
// Should be reverted once reviewed — see the commit this lands in.
//
// Runs entirely with the sync tick trigger disabled (every migration does — see
// disableSyncTickTrigger/enableSyncTickTrigger in services/migrations/hooks), so every write here
// takes the same path a real migration's data changes would: flagged for the self-heal pass rather
// than advancing the sync clock. Covers, against reference_data and patients (both already
// lookup-tracked, real models):
//   - a fresh insert with no prior sync_lookup row (stubbed, then healed)
//   - an insert immediately followed by an update (the row drifts before it's ever built)
//   - a hard delete with no other record depending on it (flagged, then removed by the backstop)
//   - the FK-atomicity case the hard-delete design exists for: a record's foreign key is
//     repointed away from another record, which is then hard-deleted. Both changes must reach an
//     external sync snapshot together or not at all — see flagSyncLookupForRebuildOnHardDelete.
// DML only, per packages/database/CLAUDE.md — the new tables from the DDL migration are assumed
// to already exist.
export async function up(query: QueryInterface): Promise<void> {
  const log = (step: number, tableName: string, recordId: string, action: string, detail: string) =>
    query.sequelize.query(
      `
        INSERT INTO self_heal_manual_test_log (step, table_name, record_id, action, detail)
        VALUES (:step, :tableName, :recordId, :action, :detail);
      `,
      { replacements: { step, tableName, recordId, action, detail } },
    );

  // --- New, unrelated table: smoke test only, not lookup-tracked (no backing model) ---
  await query.sequelize.query(`
    INSERT INTO self_heal_manual_test_widgets (id, label) VALUES
      ('self-heal-widget-1', 'Self-heal manual test widget 1'),
      ('self-heal-widget-2', 'Self-heal manual test widget 2');
  `);
  await log(
    1,
    'self_heal_manual_test_widgets',
    'self-heal-widget-1',
    'insert',
    'Not lookup-tracked (no model) — just confirms a new table survives the migration run.',
  );
  await log(
    2,
    'self_heal_manual_test_widgets',
    'self-heal-widget-2',
    'insert',
    'Not lookup-tracked (no model) — just confirms a new table survives the migration run.',
  );

  // --- Fresh inserts on an existing lookup-tracked table ---
  const referenceDataRowA = '11111111-1111-1111-1111-111111111101';
  const referenceDataRowB = '11111111-1111-1111-1111-111111111102';
  const referenceDataRowC = '11111111-1111-1111-1111-111111111103';
  const villageOld = '11111111-1111-1111-1111-111111111201';
  const villageNew = '11111111-1111-1111-1111-111111111202';
  const testPatient = '11111111-1111-1111-1111-111111111301';

  await query.sequelize.query(`
    INSERT INTO reference_data (id, code, type, name) VALUES
      ('${referenceDataRowA}', 'SELF_HEAL_TEST_A', 'selfHealManualTest', 'Self-heal manual test A'),
      ('${referenceDataRowB}', 'SELF_HEAL_TEST_B', 'selfHealManualTest', 'Self-heal manual test B'),
      ('${referenceDataRowC}', 'SELF_HEAL_TEST_C', 'selfHealManualTest', 'Self-heal manual test C'),
      ('${villageOld}', 'SELF_HEAL_TEST_VILLAGE_OLD', 'village', 'Self-heal manual test village (old)'),
      ('${villageNew}', 'SELF_HEAL_TEST_VILLAGE_NEW', 'village', 'Self-heal manual test village (new)');
  `);
  await log(
    3,
    'reference_data',
    referenceDataRowA,
    'insert',
    'Untouched after this. Expect: healed with data.name = "Self-heal manual test A", needs_rebuild = false, updated_at_sync_tick = 0 (stub placeholder — never touched again).',
  );
  await log(
    4,
    'reference_data',
    referenceDataRowB,
    'insert',
    'Updated in step 9 before ever being built. Expect: healed with data.name = "Self-heal manual test B (edited by migration)".',
  );
  await log(
    5,
    'reference_data',
    referenceDataRowC,
    'insert',
    'Hard-deleted in step 11 before ever being built. Expect: no sync_lookup row at all once self-heal has run.',
  );
  await log(
    6,
    'reference_data',
    villageOld,
    'insert',
    'Patient below points here first, then is repointed away in step 10, then this row is hard-deleted in step 12. Expect: no sync_lookup row at all once self-heal has run.',
  );
  await log(
    7,
    'reference_data',
    villageNew,
    'insert',
    'The patient below is repointed to here in step 10. Expect: healed with data.name = "Self-heal manual test village (new)".',
  );

  await query.sequelize.query(`
    INSERT INTO patients (id, display_id, first_name, last_name, sex, village_id) VALUES
      ('${testPatient}', 'SELF-HEAL-TEST-001', 'SelfHealManualTest', 'Patient', 'other', '${villageOld}');
  `);
  await log(
    8,
    'patients',
    testPatient,
    'insert',
    'village_id initially points at the "old" village row above; repointed in step 10.',
  );

  // --- Drift: a row is edited before it has ever been built into sync_lookup ---
  await query.sequelize.query(`
    UPDATE reference_data SET name = 'Self-heal manual test B (edited by migration)'
    WHERE id = '${referenceDataRowB}';
  `);
  await log(
    9,
    'reference_data',
    referenceDataRowB,
    'update',
    'Renamed to "Self-heal manual test B (edited by migration)".',
  );

  // --- FK-atomicity: repoint the patient's village before the old village is hard-deleted ---
  await query.sequelize.query(`
    UPDATE patients SET village_id = '${villageNew}' WHERE id = '${testPatient}';
  `);
  await log(
    10,
    'patients',
    testPatient,
    'update',
    `village_id repointed from the "old" village (${villageOld}) to the "new" village (${villageNew}), which is then hard-deleted in step 12. Expect: healed patient data.villageId = "${villageNew}", and the old village's sync_lookup row gone — both landing in the same self-heal build.`,
  );

  // --- Plain hard delete, unrelated to any other record ---
  await query.sequelize.query(`
    DELETE FROM reference_data WHERE id = '${referenceDataRowC}';
  `);
  await log(
    11,
    'reference_data',
    referenceDataRowC,
    'hard_delete',
    'No other record depends on this row. Expect: no sync_lookup row at all once self-heal has run.',
  );

  // --- The hard delete the FK-atomicity case above depends on ---
  await query.sequelize.query(`
    DELETE FROM reference_data WHERE id = '${villageOld}';
  `);
  await log(
    12,
    'reference_data',
    villageOld,
    'hard_delete',
    'The patient above was already repointed away from this row in step 10. Expect: no sync_lookup row at all once self-heal has run, and the patient row healed with the new village_id — never both a dangling reference and this row present at once.',
  );
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DELETE FROM patients WHERE id = '11111111-1111-1111-1111-111111111301';
  `);
  await query.sequelize.query(`
    DELETE FROM reference_data WHERE id IN (
      '11111111-1111-1111-1111-111111111101',
      '11111111-1111-1111-1111-111111111102',
      '11111111-1111-1111-1111-111111111103',
      '11111111-1111-1111-1111-111111111201',
      '11111111-1111-1111-1111-111111111202'
    );
  `);
  await query.sequelize.query(`
    DELETE FROM self_heal_manual_test_widgets WHERE id IN ('self-heal-widget-1', 'self-heal-widget-2');
  `);
  await query.sequelize.query(`
    DELETE FROM sync_lookup WHERE record_id IN (
      '11111111-1111-1111-1111-111111111101',
      '11111111-1111-1111-1111-111111111102',
      '11111111-1111-1111-1111-111111111103',
      '11111111-1111-1111-1111-111111111201',
      '11111111-1111-1111-1111-111111111202',
      '11111111-1111-1111-1111-111111111301'
    );
  `);
  await query.sequelize.query(`
    TRUNCATE self_heal_manual_test_log;
  `);
}
