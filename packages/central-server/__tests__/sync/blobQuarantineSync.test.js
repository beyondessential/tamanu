import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { FACT_CURRENT_SYNC_TICK, FACT_LOOKUP_UP_TO_TICK } from '@tamanu/constants/facts';
import { SYSTEM_USER_UUID } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';

import {
  createTestContext,
  initializeCentralSyncManagerWithContext,
  waitForSession,
} from '../utilities';

// spec: AV
// Central scans and its verdict is authoritative, so a quarantine is written on
// central and pulled everywhere: a facility or device that runs no scanner of
// its own still knows not to serve, fetch or heal the content. The record
// carries no scope, so it reaches a server whether or not that server holds the
// bytes or shares a patient with whoever uploaded them.
describe('Blob quarantine propagation', () => {
  let ctx;
  let models;

  const INFECTED_HASH = `sha256:${'ab'.repeat(32)}`;

  const lookupEnabledConfig = {
    sync: {
      lookupTable: { enabled: true },
      maxRecordsPerSnapshotChunk: 100000000,
    },
  };

  const quarantinesPulledBy = async (centralSyncManager, { facilityIds, isMobile = false }) => {
    const { sessionId } = await centralSyncManager.startSession({ facilityIds, isMobile });
    await waitForSession(centralSyncManager, sessionId);
    await centralSyncManager.setupSnapshotForPull(sessionId, { since: 1, facilityIds }, () => true);
    const changes = await centralSyncManager.getOutgoingChanges(sessionId, {});
    return changes.filter(change => change.recordType === 'blob_quarantines');
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx.store);
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    vi.resetModules();
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 2);
    await models.SyncLookupTick.truncate({ force: true });
    await models.SyncDeviceTick.truncate({ force: true });
    await models.BlobQuarantine.truncate({ force: true });
    await models.Facility.truncate({ cascade: true, force: true });
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

    await models.BlobQuarantine.create({
      hash: INFECTED_HASH,
      scannerVersion: 'ClamAV 1.0.5',
      signatureVersion: '27100',
    });
  });

  it('sends a quarantine to a facility with the versions behind the verdict', async () => {
    const facility = await models.Facility.create(fake(models.Facility));
    const centralSyncManager = await initializeCentralSyncManagerWithContext(ctx);

    const [quarantine, ...rest] = await quarantinesPulledBy(centralSyncManager, {
      facilityIds: [facility.id],
    });

    expect(rest).toHaveLength(0);
    expect(quarantine.data).toMatchObject({
      hash: INFECTED_HASH,
      scannerVersion: 'ClamAV 1.0.5',
      signatureVersion: '27100',
    });
  });

  it('sends it to a facility sharing neither content nor patients with the upload', async () => {
    const unrelatedFacility = await models.Facility.create(fake(models.Facility));
    const centralSyncManager = await initializeCentralSyncManagerWithContext(ctx);

    const quarantines = await quarantinesPulledBy(centralSyncManager, {
      facilityIds: [unrelatedFacility.id],
    });

    expect(quarantines.map(({ data }) => data.hash)).toEqual([INFECTED_HASH]);
  });

  it('sends it to a device session', async () => {
    const facility = await models.Facility.create(fake(models.Facility));
    const centralSyncManager = await initializeCentralSyncManagerWithContext(ctx);

    const quarantines = await quarantinesPulledBy(centralSyncManager, {
      facilityIds: [facility.id],
      isMobile: true,
    });

    expect(quarantines.map(({ data }) => data.hash)).toEqual([INFECTED_HASH]);
  });

  it('sends it through the sync lookup table', async () => {
    // The deployed configuration snapshots from sync_lookup rather than the
    // source tables, so an unscoped record has to reach the lookup to propagate.
    vi.doMock('@tamanu/shared/utils/withConfig', () => ({
      withConfig: fn => {
        const inner = (...args) => fn(...args, lookupEnabledConfig);
        inner.overrideConfig = fn;
        return inner;
      },
    }));
    const facility = await models.Facility.create(fake(models.Facility));
    const centralSyncManager = await initializeCentralSyncManagerWithContext(
      ctx,
      lookupEnabledConfig,
    );
    await centralSyncManager.updateLookupTable();

    const lookup = await models.SyncLookup.findOne({
      where: { recordType: 'blob_quarantines' },
    });
    expect(lookup.patientId).toBeNull();
    expect(lookup.facilityId).toBeNull();

    const quarantines = await quarantinesPulledBy(centralSyncManager, {
      facilityIds: [facility.id],
    });
    expect(quarantines.map(({ data }) => data.hash)).toEqual([INFECTED_HASH]);
  });
});
