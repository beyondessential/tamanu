# 12. Conflict repro: stale lookup row after a device's own push

## Result

The hypothesis is confirmed in all variants. Driving the real `CentralSyncManager` methods (start session, push, complete push, pull, `updateLookupTable`), with the lookup table enabled and `avoidRepull` on:

- Variant (a), direct central edit to version Y, then device X pushes version X: in the same session X's pull snapshot contains the stale version Y from the lookup table (saved tick 11). After the lookup refresh the row is version X with `pushed_by_device_id = device-x`, and X's next pull (new cursor) returns nothing for the record. Central holds version X; X was handed version Y and never corrected.
- Variant (b), version Y arrives by a real push from device Y: same outcome (stale Y at saved tick 17, then nothing).
- Control, lookup refreshed between the push and the pull: the same-session pull contains nothing for the record, as expected.
- PatientAdditionalData (field-level merge): Y changes passport, X changes birthCertificate, central merges to both. X's same-session pull receives the stale row (passport = Y, birthCertificate = original, saved tick 17), not the merged row. After the refresh the row is merged and tagged as pushed by X, and X's next pull returns nothing, so X never receives the merged row. (A facility applying the stale row would only lose its own field if its merge treats the stale row as newer; not tested here.)

Notes on the harness: `config/test.json5` sets `sync.lookupTable.enabled = false` in the module-level config that `snapshotOutgoingChanges` reads, so the test switches it on (production default is on). Without that, the pull reads the real tables and returns version X, which first looked like a refutation but was a harness artefact. Probe pulls from a third device and from a fresh X session (no push) in the stale state also return version Y; they are extra sessions and do not change central data. The test writes its log lines to a file because vitest hid console output for passing tests.

## Test source (`packages/central-server/__tests__/sync/CentralSyncManager.conflictRepro.test.js`)

```js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryTypes } from 'sequelize';
import config from 'config';
import fs from 'node:fs';

const out = line => fs.appendFileSync('/tmp/p14-repro.log', `${line}\n`);
import { FACT_CURRENT_SYNC_TICK, FACT_LOOKUP_UP_TO_TICK } from '@tamanu/constants/facts';
import { SYNC_SESSION_DIRECTION } from '@tamanu/database/sync';
import { fake } from '@tamanu/fake-data/fake';
import { SYSTEM_USER_UUID } from '@tamanu/constants';

import {
  createTestContext,
  waitForSession,
  waitForPushCompleted,
  initializeCentralSyncManagerWithContext,
} from '../utilities';

const CONFIG = {
  sync: {
    lookupTable: { enabled: true, avoidRepull: true },
    maxRecordsPerSnapshotChunk: 1000000000,
  },
};

describe('Conflict repro: stale sync_lookup row vs avoid-repull', () => {
  let ctx;
  let models;
  let sequelize;
  let manager;
  let facility;
  let originalLookupEnabled;
  const DEVICE_X = 'device-x';
  const DEVICE_Y = 'device-y';

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models, sequelize } = ctx.store);
    // config/test.json5 turns the lookup table off for the module-level config that
    // snapshotOutgoingChanges reads (production default is on), so switch it on here
    originalLookupEnabled = config.sync.lookupTable.enabled;
    config.sync.lookupTable.enabled = true;
    config.sync.lookupTable.avoidRepull = true;
  });
  afterAll(async () => {
    config.sync.lookupTable.enabled = originalLookupEnabled;
    await ctx.close();
  });

  beforeEach(async () => {
    vi.resetModules();
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 2);
    await models.SyncLookupTick.truncate({ force: true });
    await models.SyncDeviceTick.truncate({ force: true });
    await models.PatientFacility.truncate({ force: true });
    await models.PatientAdditionalData.truncate({ force: true, cascade: true });
    await models.Patient.truncate({ force: true, cascade: true });
    await models.Facility.truncate({ cascade: true, force: true });
    await models.ReferenceData.truncate({ cascade: true, force: true });
    await models.User.truncate({ cascade: true, force: true });
    await models.User.create({
      id: SYSTEM_USER_UUID,
      email: 'system',
      displayName: 'System',
      role: 'system',
    });
    await models.LocalSystemFact.set(FACT_LOOKUP_UP_TO_TICK, null);
    await models.SyncLookup.truncate({ force: true });
    await models.DebugLog.truncate({ force: true });
    facility = await models.Facility.create(fake(models.Facility));
    manager = await initializeCentralSyncManagerWithContext(ctx, CONFIG);
  });

  const lookupRow = async recordId => {
    const rows = await sequelize.query(
      `SELECT record_id, record_type, data, pushed_by_device_id, updated_at_sync_tick
       FROM sync_lookup WHERE record_id = :recordId`,
      { replacements: { recordId }, type: QueryTypes.SELECT },
    );
    return rows[0];
  };

  const describeRows = (rows, field, recordId) =>
    rows
      .filter(r => r.recordId === recordId)
      .map(r => ({
        recordId: r.recordId,
        [field]: r.data[field],
        savedAtSyncTick: r.savedAtSyncTick,
      }));

  const startSession = async deviceId => {
    const { sessionId } = await manager.startSession({ deviceId, facilityIds: [facility.id] });
    await waitForSession(manager, sessionId);
    return sessionId;
  };

  const push = async (sessionId, deviceId, recordType, recordId, data) => {
    await manager.addIncomingChanges(sessionId, [
      { direction: SYNC_SESSION_DIRECTION.OUTGOING, isDeleted: false, recordType, recordId, data },
    ]);
    await manager.completePush(sessionId, deviceId);
    await waitForPushCompleted(manager, sessionId);
  };

  const pull = async (sessionId, deviceId, since) => {
    await manager.setupSnapshotForPull(
      sessionId,
      { since, facilityIds: [facility.id], deviceId },
      () => true,
    );
    const changes = await manager.getOutgoingChanges(sessionId, { limit: 1000 });
    const { pullUntil } = await manager.fetchPullMetadata(sessionId);
    return { changes, pullUntil };
  };

  // Steps 1 and the initial pull by X: returns X's cursor
  const setupPatient = async () => {
    const patient = await models.Patient.create({ ...fake(models.Patient), firstName: 'Original' });
    await models.PatientFacility.create({ patientId: patient.id, facilityId: facility.id });
    await manager.updateLookupTable();
    const s0 = await startSession(DEVICE_X);
    const { pullUntil } = await pull(s0, DEVICE_X, -1);
    return { patient, cursorX: pullUntil };
  };

  const updateLookupAndLog = async (recordId, label) => {
    await manager.updateLookupTable();
    const row = await lookupRow(recordId);
    out(
      `[repro] ${label}: lookup row firstName=${row?.data?.firstName} pushed_by=${row?.pushed_by_device_id} tick=${row?.updated_at_sync_tick}`,
    );
    return row;
  };

  const runScenario = async ({ viaPushFromY, refreshBeforeStep4 }) => {
    const { patient, cursorX } = await setupPatient();
    out(`[repro] X cursor after initial pull = ${cursorX}`);

    // Step 2: someone else changes R, lookup refreshed
    if (viaPushFromY) {
      const sy = await startSession(DEVICE_Y);
      await push(sy, DEVICE_Y, 'patients', patient.id, {
        ...patient.dataValues,
        firstName: 'VersionY',
      });
      await manager.endSession(sy);
    } else {
      await models.Patient.update({ firstName: 'VersionY' }, { where: { id: patient.id } });
    }
    await updateLookupAndLog(patient.id, 'after step 2 (version Y)');

    // Step 3: X pushes version X
    const sx = await startSession(DEVICE_X);
    await push(sx, DEVICE_X, 'patients', patient.id, {
      ...patient.dataValues,
      firstName: 'VersionX',
    });
    await patient.reload();
    const deviceTick = await models.SyncDeviceTick.findByPk(patient.updatedAtSyncTick);
    out(
      `[repro] after step 3: central firstName=${patient.firstName} updatedAtSyncTick=${patient.updatedAtSyncTick} deviceTick.deviceId=${deviceTick?.deviceId}`,
    );

    if (refreshBeforeStep4) await updateLookupAndLog(patient.id, 'control refresh before step 4');

    // DEBUG probe: a different device Z pulling now from the same cursor, in its own session
    {
      const sz = await startSession('device-z');
      const z = await pull(sz, 'device-z', cursorX);
      out(`[repro] PROBE device-z pull rows for R: ${JSON.stringify(describeRows(z.changes, 'firstName', patient.id))}`);
      const sx2 = await startSession(DEVICE_X);
      const x2 = await pull(sx2, DEVICE_X, cursorX);
      out(`[repro] PROBE device-x fresh-session (no push) pull rows for R: ${JSON.stringify(describeRows(x2.changes, 'firstName', patient.id))}`);
    }
    // Step 4: same session pull
    const step4 = await pull(sx, DEVICE_X, cursorX);
    const step4Rows = describeRows(step4.changes, 'firstName', patient.id);
    out(`[repro] step 4 snapshot rows for R: ${JSON.stringify(step4Rows)}`);
    await manager.endSession(sx);

    // Step 5
    const lookupAfter = await updateLookupAndLog(patient.id, 'after step 5 refresh');

    // Step 6: new session, new cursor
    const s6 = await startSession(DEVICE_X);
    const step6 = await pull(s6, DEVICE_X, step4.pullUntil);
    const step6Rows = describeRows(step6.changes, 'firstName', patient.id);
    out(
      `[repro] step 6 (since=${step4.pullUntil}) snapshot rows for R: ${JSON.stringify(step6Rows)}`,
    );
    return { step4Rows, step6Rows, lookupAfter, patient };
  };

  it('(a) direct central edit: X receives stale version Y in step 4 and nothing in step 6', async () => {
    const { step4Rows, step6Rows, lookupAfter } = await runScenario({
      viaPushFromY: false,
      refreshBeforeStep4: false,
    });
    expect(step4Rows.map(r => r.firstName)).toEqual(['VersionY']);
    expect(lookupAfter.data.firstName).toBe('VersionX');
    expect(lookupAfter.pushed_by_device_id).toBe(DEVICE_X);
    expect(step6Rows).toEqual([]);
  });

  it('(b) push from device Y: X receives stale version Y in step 4 and nothing in step 6', async () => {
    const { step4Rows, step6Rows, lookupAfter } = await runScenario({
      viaPushFromY: true,
      refreshBeforeStep4: false,
    });
    expect(step4Rows.map(r => r.firstName)).toEqual(['VersionY']);
    expect(lookupAfter.data.firstName).toBe('VersionX');
    expect(lookupAfter.pushed_by_device_id).toBe(DEVICE_X);
    expect(step6Rows).toEqual([]);
  });

  it('(control) lookup refreshed between steps 3 and 4: step 4 has no row for R', async () => {
    const { step4Rows } = await runScenario({ viaPushFromY: false, refreshBeforeStep4: true });
    expect(step4Rows).toEqual([]);
  });

  it('(PAD) field-level merge: does X ever receive the merged row?', async () => {
    const patient = await models.Patient.create(fake(models.Patient));
    await models.PatientFacility.create({ patientId: patient.id, facilityId: facility.id });
    const pad = await models.PatientAdditionalData.create({
      ...fake(models.PatientAdditionalData),
      patientId: patient.id,
      passport: 'orig-passport',
      birthCertificate: 'orig-bc',
      updatedAtByField: {},
    });
    await manager.updateLookupTable();
    const s0 = await startSession(DEVICE_X);
    const { pullUntil: cursorX } = await pull(s0, DEVICE_X, -1);
    const show = rows =>
      rows
        .filter(r => r.recordId === pad.id)
        .map(r => ({
          passport: r.data.passport,
          birthCertificate: r.data.birthCertificate,
          savedAtSyncTick: r.savedAtSyncTick,
        }));

    // Y changes passport only
    const sy = await startSession(DEVICE_Y);
    await push(sy, DEVICE_Y, 'patient_additional_data', pad.id, {
      ...pad.dataValues,
      passport: 'Y-passport',
      updatedAtByField: { passport: 5000 },
    });
    await manager.endSession(sy);
    await manager.updateLookupTable();

    // X changes birthCertificate only (passport untouched on X, so no field tick)
    const sx = await startSession(DEVICE_X);
    await push(sx, DEVICE_X, 'patient_additional_data', pad.id, {
      ...pad.dataValues,
      birthCertificate: 'X-bc',
      updatedAtByField: { birth_certificate: 6000 },
    });
    await pad.reload();
    out(
      `[repro-pad] central after merge: passport=${pad.passport} birthCertificate=${pad.birthCertificate}`,
    );
    const step4 = await pull(sx, DEVICE_X, cursorX);
    out(`[repro-pad] step 4 rows: ${JSON.stringify(show(step4.changes))}`);
    await manager.endSession(sx);

    await manager.updateLookupTable();
    const row = await lookupRow(pad.id);
    out(
      `[repro-pad] lookup after refresh: passport=${row.data.passport} bc=${row.data.birthCertificate} pushed_by=${row.pushed_by_device_id} tick=${row.updated_at_sync_tick}`,
    );
    const s6 = await startSession(DEVICE_X);
    const step6 = await pull(s6, DEVICE_X, step4.pullUntil);
    out(`[repro-pad] step 6 rows: ${JSON.stringify(show(step6.changes))}`);
    expect(pad.passport).toBe('Y-passport');
  });
});
```

## Output

Log lines written by the test (three scenarios in order: (a), (b), control; then PAD):

```
[repro] X cursor after initial pull = 7
[repro] after step 2 (version Y): lookup row firstName=VersionY pushed_by=null tick=11
[repro] after step 3: central firstName=VersionX updatedAtSyncTick=16 deviceTick.deviceId=device-x
[repro] PROBE device-z pull rows for R: [{"recordId":"32678e1e-8f22-0000-85c0-94c46802d453","firstName":"VersionY","savedAtSyncTick":"11"}]
[repro] PROBE device-x fresh-session (no push) pull rows for R: [{"recordId":"32678e1e-8f22-0000-85c0-94c46802d453","firstName":"VersionY","savedAtSyncTick":"11"}]
[repro] step 4 snapshot rows for R: [{"recordId":"32678e1e-8f22-0000-85c0-94c46802d453","firstName":"VersionY","savedAtSyncTick":"11"}]
[repro] after step 5 refresh: lookup row firstName=VersionX pushed_by=device-x tick=31
[repro] step 6 (since=27) snapshot rows for R: []
[repro] X cursor after initial pull = 7
[repro] after step 2 (version Y): lookup row firstName=VersionY pushed_by=device-y tick=17
[repro] after step 3: central firstName=VersionX updatedAtSyncTick=22 deviceTick.deviceId=device-x
[repro] PROBE device-z pull rows for R: [{"recordId":"cdc21d1f-8a48-0000-8a1c-84bd97e21508","firstName":"VersionY","savedAtSyncTick":"17"}]
[repro] PROBE device-x fresh-session (no push) pull rows for R: [{"recordId":"cdc21d1f-8a48-0000-8a1c-84bd97e21508","firstName":"VersionY","savedAtSyncTick":"17"}]
[repro] step 4 snapshot rows for R: [{"recordId":"cdc21d1f-8a48-0000-8a1c-84bd97e21508","firstName":"VersionY","savedAtSyncTick":"17"}]
[repro] after step 5 refresh: lookup row firstName=VersionX pushed_by=device-x tick=37
[repro] step 6 (since=33) snapshot rows for R: []
[repro] X cursor after initial pull = 7
[repro] after step 2 (version Y): lookup row firstName=VersionY pushed_by=null tick=11
[repro] after step 3: central firstName=VersionX updatedAtSyncTick=16 deviceTick.deviceId=device-x
[repro] control refresh before step 4: lookup row firstName=VersionX pushed_by=device-x tick=21
[repro] PROBE device-z pull rows for R: [{"recordId":"4d19a2ea-b831-0000-8427-8be4c1f6fb34","firstName":"VersionX","savedAtSyncTick":"21"}]
[repro] PROBE device-x fresh-session (no push) pull rows for R: []
[repro] step 4 snapshot rows for R: []
[repro] after step 5 refresh: lookup row firstName=VersionX pushed_by=device-x tick=21
[repro] step 6 (since=31) snapshot rows for R: []
[repro-pad] central after merge: passport=Y-passport birthCertificate=X-bc
[repro-pad] step 4 rows: [{"passport":"Y-passport","birthCertificate":"orig-bc","savedAtSyncTick":"17"}]
[repro-pad] lookup after refresh: passport=Y-passport bc=X-bc pushed_by=device-x tick=29
[repro-pad] step 6 rows: []
```

Vitest summary:

```
14: Test Files  1 passed (1)
15:      Tests  4 passed (4)
```
