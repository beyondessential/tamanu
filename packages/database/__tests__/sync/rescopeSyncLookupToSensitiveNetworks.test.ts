import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { fake } from '@tamanu/fake-data/fake';

import { closeDatabase, createTestDatabase } from '../utilities';
import { up as rescopeLookupRows } from '../../src/migrations/1787700000000-rescopeSyncLookupToSensitiveNetworks';

// spec: specs/sync/sensitive-networks.md
describe('rescoping sync_lookup to sensitive networks', () => {
  let models;
  let sequelize;

  beforeAll(async () => {
    ({ models, sequelize } = await createTestDatabase());
  });

  beforeEach(async () => {
    await models.SyncLookup.truncate({ force: true });
    await models.Facility.truncate({ cascade: true, force: true });
    await models.SensitiveNetwork.truncate({ cascade: true, force: true });
  });

  afterAll(async () => {
    await closeDatabase();
  });

  const createNetwork = () => models.SensitiveNetwork.create(fake(models.SensitiveNetwork));
  const createFacility = (sensitiveNetworkId = null) =>
    models.Facility.create(fake(models.Facility, { sensitiveNetworkId }));

  // Written straight in, the shape the old facility-based population left behind.
  const createLookupRow = async ({ recordType, facilityId, updatedAtSyncTick = 5 }) => {
    const recordId = models.Facility.generateId();
    await sequelize.query(
      `
      INSERT INTO sync_lookup (
        record_id, record_type, is_deleted, is_lab_request, updated_at_sync_tick, data, facility_id
      ) VALUES (:recordId, :recordType, false, false, :updatedAtSyncTick, '{}'::jsonb, :facilityId);
      `,
      { replacements: { recordId, recordType, updatedAtSyncTick, facilityId } },
    );
    return recordId;
  };

  const readLookupRow = async recordId => {
    const [[row]] = await sequelize.query(
      `SELECT facility_id, sensitive_network_id, updated_at_sync_tick
       FROM sync_lookup WHERE record_id = :recordId;`,
      { replacements: { recordId } },
    );
    return row;
  };

  it('moves an encounter-scoped row from its facility onto that facility’s network', async () => {
    const network = await createNetwork();
    const facility = await createFacility(network.id);
    const recordId = await createLookupRow({ recordType: 'encounters', facilityId: facility.id });

    await rescopeLookupRows(sequelize.getQueryInterface());

    const row = await readLookupRow(recordId);
    expect(row.sensitive_network_id).toBe(network.id);
    expect(row.facility_id).toBeNull();
  });

  it('leaves the sync tick alone, so no facility re-pulls a record it already holds', async () => {
    const network = await createNetwork();
    const facility = await createFacility(network.id);
    const recordId = await createLookupRow({
      recordType: 'encounters',
      facilityId: facility.id,
      updatedAtSyncTick: 7,
    });

    await rescopeLookupRows(sequelize.getQueryInterface());

    expect((await readLookupRow(recordId)).updated_at_sync_tick).toBe('7');
  });

  it('leaves a row scoped to a facility deleted while it was sensitive alone', async () => {
    // The backfill gives such a facility no network, so nulling its facility would leave the row
    // with neither scope and send it everywhere rather than nowhere.
    const facility = await createFacility(null);
    await facility.destroy();
    // a live networked facility, so the migration runs instead of bailing out
    await createFacility((await createNetwork()).id);
    const recordId = await createLookupRow({ recordType: 'encounters', facilityId: facility.id });

    await rescopeLookupRows(sequelize.getQueryInterface());

    const row = await readLookupRow(recordId);
    expect(row.facility_id).toBe(facility.id);
    expect(row.sensitive_network_id).toBeNull();
  });

  it('leaves a genuinely facility-bound row alone', async () => {
    const network = await createNetwork();
    const facility = await createFacility(network.id);
    const recordId = await createLookupRow({
      recordType: 'patient_facilities',
      facilityId: facility.id,
    });

    await rescopeLookupRows(sequelize.getQueryInterface());

    const row = await readLookupRow(recordId);
    expect(row.facility_id).toBe(facility.id);
    expect(row.sensitive_network_id).toBeNull();
  });

  it('rescopes nothing on a deployment with no networked facility', async () => {
    const facility = await createFacility(null);
    const recordId = await createLookupRow({ recordType: 'encounters', facilityId: facility.id });

    await rescopeLookupRows(sequelize.getQueryInterface());

    const row = await readLookupRow(recordId);
    expect(row.facility_id).toBe(facility.id);
    expect(row.sensitive_network_id).toBeNull();
  });
});
