import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { QueryTypes } from 'sequelize';
import config from 'config';
import { fake } from '@tamanu/fake-data/fake';
import { FACT_CURRENT_SYNC_TICK, FACT_SYNC_TRIGGER_CONTROL } from '@tamanu/constants/facts';
import { log } from '@tamanu/shared/services/logging/log';
import { closeDatabase, createTestDatabase } from '../utilities';
import { runPostMigration } from '../../src/services/migrations/hooks';

let nextSyncLookupId = 1;
const createLookupRow = (models, overrides) =>
  models.SyncLookup.create({
    id: nextSyncLookupId++,
    isLabRequest: false,
    isDeleted: false,
    needsRebuild: false,
    ...overrides,
  });

// Trigger-level coverage for the sync_lookup self-healing mechanism (spec: LOOKUP). See
// .workhorse/test-cases/p1/overview.md for the scenarios this exercises. The build-level (pass
// 1/pass 2) behaviour is covered by central-server integration tests, since it lives there.
//
// This package's test config (packages/database/config/test.json) sets serverFacilityIds, which
// simulates a facility server — so by default the sync tick trigger is installed without the
// lookup-tracked flagging arg. Flip to central for the suite and restore facility mode afterwards
// so later test files in the same run see the config/trigger state they expect.
describe('sync_lookup self healing (trigger level)', () => {
  let models;
  let sequelize;
  let originalServerFacilityIds;

  beforeAll(async () => {
    const database = await createTestDatabase();
    ({ models, sequelize } = database);

    originalServerFacilityIds = config.serverFacilityIds;
    delete config.serverFacilityIds;
    await runPostMigration(log, sequelize);
  });

  afterAll(async () => {
    config.serverFacilityIds = originalServerFacilityIds;
    await runPostMigration(log, sequelize);
    await closeDatabase();
  });

  beforeEach(async () => {
    await models.LocalSystemFact.set(FACT_SYNC_TRIGGER_CONTROL, 'enabled');
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 10);
    await models.SyncLookup.truncate({ force: true });
  });

  const disableSyncTrigger = () =>
    models.LocalSystemFact.set(FACT_SYNC_TRIGGER_CONTROL, 'disabled');
  const enableSyncTrigger = () => models.LocalSystemFact.set(FACT_SYNC_TRIGGER_CONTROL, 'enabled');

  describe('flagging', () => {
    it('bumps the tick and does not touch sync_lookup for a clock-advancing write', async () => {
      const patient = await models.Patient.create(fake(models.Patient));

      expect(parseInt(patient.updatedAtSyncTick, 10)).toBeGreaterThan(0);
      const lookupRow = await models.SyncLookup.findOne({
        where: { recordId: patient.id, recordType: 'patients' },
      });
      expect(lookupRow).toBeNull();
    });

    it('flags an existing lookup row and leaves its tick unchanged when disabled', async () => {
      const patient = await models.Patient.create(fake(models.Patient));
      const originalTick = patient.updatedAtSyncTick;
      await createLookupRow(models, {
        recordId: patient.id,
        recordType: 'patients',
        data: { id: patient.id },
        updatedAtSyncTick: originalTick,
      });

      await disableSyncTrigger();
      await patient.update({ firstName: 'Changed while disabled' });
      await enableSyncTrigger();

      await patient.reload();
      expect(patient.updatedAtSyncTick).toEqual(originalTick);

      const lookupRow = await models.SyncLookup.findOne({
        where: { recordId: patient.id, recordType: 'patients' },
      });
      expect(lookupRow.needsRebuild).toBe(true);
      expect(lookupRow.updatedAtSyncTick).toEqual(originalTick);
    });

    it('stubs a missing lookup row when disabled and no row exists yet', async () => {
      await disableSyncTrigger();
      const patient = await models.Patient.create(fake(models.Patient));
      await enableSyncTrigger();

      const lookupRow = await models.SyncLookup.findOne({
        where: { recordId: patient.id, recordType: 'patients' },
      });
      expect(lookupRow).not.toBeNull();
      expect(lookupRow.data).toBeNull();
      expect(lookupRow.needsRebuild).toBe(true);
      expect(lookupRow.isDeleted).toBe(false);
    });

    it('does not flag or stub a push-only table even when disabled', async () => {
      const user = await models.User.create(fake(models.User));

      await disableSyncTrigger();
      const loginAttempt = await models.UserLoginAttempt.create({
        userId: user.id,
        outcome: 'success',
      });
      await enableSyncTrigger();

      const lookupRow = await models.SyncLookup.findOne({
        where: { recordId: loginAttempt.id, recordType: 'user_login_attempts' },
      });
      expect(lookupRow).toBeNull();
    });
  });

  describe('hard deletes', () => {
    it('deletes the matching lookup row immediately on hard delete', async () => {
      const patient = await models.Patient.create(fake(models.Patient));
      await createLookupRow(models, {
        recordId: patient.id,
        recordType: 'patients',
        data: { id: patient.id },
        updatedAtSyncTick: patient.updatedAtSyncTick,
      });

      await patient.destroy({ force: true });

      const lookupRow = await models.SyncLookup.findOne({
        where: { recordId: patient.id, recordType: 'patients' },
      });
      expect(lookupRow).toBeNull();
    });

    it('deletes the matching lookup row on hard delete even while the sync tick trigger is disabled', async () => {
      const patient = await models.Patient.create(fake(models.Patient));
      await createLookupRow(models, {
        recordId: patient.id,
        recordType: 'patients',
        data: { id: patient.id },
        updatedAtSyncTick: patient.updatedAtSyncTick,
      });

      await disableSyncTrigger();
      await patient.destroy({ force: true });
      await enableSyncTrigger();

      const lookupRow = await models.SyncLookup.findOne({
        where: { recordId: patient.id, recordType: 'patients' },
      });
      expect(lookupRow).toBeNull();
    });
  });

  it('has a partial index on needs_rebuild for the self-heal scan', async () => {
    const rows = await sequelize.query(
      `SELECT indexdef FROM pg_indexes WHERE tablename = 'sync_lookup' AND indexname = 'sync_lookup_needs_rebuild_index'`,
      { type: QueryTypes.SELECT },
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].indexdef).toContain('WHERE needs_rebuild');
  });

  describe('trigger install axes (server type)', () => {
    it('installs the tick trigger without the lookup-tracked arg on a facility server', async () => {
      const originalServerFacilityId = config.serverFacilityId;
      config.serverFacilityId = 'test-facility';
      try {
        await runPostMigration(log, sequelize);

        const [row] = await sequelize.query(
          `
            SELECT pg_get_triggerdef(t.oid) AS definition
            FROM pg_trigger t
            JOIN pg_class c ON c.oid = t.tgrelid
            WHERE c.relname = 'patients' AND t.tgname = 'set_patients_updated_at_sync_tick'
          `,
          { type: QueryTypes.SELECT },
        );
        expect(row.definition).not.toContain(`'true'`);
      } finally {
        config.serverFacilityId = originalServerFacilityId;
        // restore the central-mode trigger for the rest of the suite
        await runPostMigration(log, sequelize);
      }

      const patient = await models.Patient.create(fake(models.Patient));
      await disableSyncTrigger();
      await patient.update({ firstName: 'Restored to central mode' });
      await enableSyncTrigger();

      const lookupRow = await models.SyncLookup.findOne({
        where: { recordId: patient.id, recordType: 'patients' },
      });
      expect(lookupRow?.needsRebuild).toBe(true);
    });
  });
});
