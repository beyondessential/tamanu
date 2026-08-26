import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { DRUG_STOCK_STATUSES, REFERENCE_TYPES, SETTINGS_SCOPES } from '@tamanu/constants';
import { settingsCache } from '@tamanu/settings';
import { fake } from '@tamanu/fake-data/fake';
import { log } from '@tamanu/shared/services/logging/log';

import { saveChangesForModel } from '../../src/sync';
import { closeDatabase, createTestDatabase } from '../utilities';

// Facility-server side of sync (isCentralServer: false): a sync pull must never clobber
// the local stock level MSupplyStockOnHandProcessor maintains for a facility where
// mSupply is the source of truth.
describe('ReferenceDrugFacility sync: mSupply stock-on-hand protection', () => {
  let models;
  let manualFacilityId;
  let sohFacilityId;
  let referenceDrugId;

  beforeAll(async () => {
    const database = await createTestDatabase();
    models = database.models;

    const manualFacility = await models.Facility.create({ ...fake(models.Facility) });
    manualFacilityId = manualFacility.id;

    const sohFacility = await models.Facility.create({ ...fake(models.Facility) });
    sohFacilityId = sohFacility.id;

    await models.Setting.set(
      'integrations.mSupplyMed',
      { stockOnHandEnabled: true },
      SETTINGS_SCOPES.FACILITY,
      sohFacilityId,
    );
    settingsCache.reset();

    const referenceData = await models.ReferenceData.create({
      ...fake(models.ReferenceData),
      type: REFERENCE_TYPES.DRUG,
    });
    const referenceDrug = await models.ReferenceDrug.create({
      ...fake(models.ReferenceDrug),
      referenceDataId: referenceData.id,
    });
    referenceDrugId = referenceDrug.id;
  });

  afterEach(async () => {
    await models.ReferenceDrugFacility.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('applies an incoming stock update as-is for a facility without stockOnHandEnabled', async () => {
    const existing = await models.ReferenceDrugFacility.create({
      referenceDrugId,
      facilityId: manualFacilityId,
      quantity: 1,
      stockStatus: DRUG_STOCK_STATUSES.IN_STOCK,
    });

    const incoming = {
      id: existing.id,
      referenceDrugId,
      facilityId: manualFacilityId,
      quantity: 42,
      stockStatus: DRUG_STOCK_STATUSES.IN_STOCK,
    };
    await saveChangesForModel(
      models.ReferenceDrugFacility,
      [{ data: incoming, isDeleted: false }],
      false,
      log,
    );

    const stock = await models.ReferenceDrugFacility.findOne({
      where: { referenceDrugId, facilityId: manualFacilityId },
    });
    expect(stock.quantity).toBe(42);
  });

  it('preserves the local stock level for a facility where mSupply is the source of truth', async () => {
    const existing = await models.ReferenceDrugFacility.create({
      referenceDrugId,
      facilityId: sohFacilityId,
      quantity: 7,
      stockStatus: DRUG_STOCK_STATUSES.IN_STOCK,
    });

    const incoming = {
      id: existing.id,
      referenceDrugId,
      facilityId: sohFacilityId,
      quantity: 999,
      stockStatus: DRUG_STOCK_STATUSES.OUT_OF_STOCK,
    };
    await saveChangesForModel(
      models.ReferenceDrugFacility,
      [{ data: incoming, isDeleted: false }],
      false,
      log,
    );

    const stock = await models.ReferenceDrugFacility.findOne({
      where: { referenceDrugId, facilityId: sohFacilityId },
    });
    // Untouched by the incoming sync data, despite it carrying a different value.
    expect(stock.quantity).toBe(7);
    expect(stock.stockStatus).toBe(DRUG_STOCK_STATUSES.IN_STOCK);
  });

  it('creates the association without a stock level for a new mSupply-facility row', async () => {
    const incoming = {
      id: `${referenceDrugId};${sohFacilityId}`,
      referenceDrugId,
      facilityId: sohFacilityId,
      quantity: 15,
      stockStatus: DRUG_STOCK_STATUSES.IN_STOCK,
    };
    await saveChangesForModel(
      models.ReferenceDrugFacility,
      [{ data: incoming, isDeleted: false }],
      false,
      log,
    );

    const stock = await models.ReferenceDrugFacility.findOne({
      where: { referenceDrugId, facilityId: sohFacilityId },
    });
    expect(stock).not.toBeNull();
    expect(stock.quantity).toBeNull();
    expect(stock.stockStatus).toBe(DRUG_STOCK_STATUSES.UNKNOWN);
  });

  it('protects the local stock level even on a full resync of an unchanged row', async () => {
    // Simulates what a facility restored from backup (or any full resync) would
    // receive: central pushing its whole current copy of the row down again,
    // including central's own (potentially stale) quantity/stockStatus.
    const existing = await models.ReferenceDrugFacility.create({
      referenceDrugId,
      facilityId: sohFacilityId,
      quantity: 30,
      stockStatus: DRUG_STOCK_STATUSES.IN_STOCK,
    });

    const centralCopy = {
      id: existing.id,
      referenceDrugId,
      facilityId: sohFacilityId,
      quantity: null,
      stockStatus: DRUG_STOCK_STATUSES.UNKNOWN,
    };
    await saveChangesForModel(
      models.ReferenceDrugFacility,
      [{ data: centralCopy, isDeleted: false }],
      false,
      log,
    );

    const stock = await models.ReferenceDrugFacility.findOne({
      where: { referenceDrugId, facilityId: sohFacilityId },
    });
    expect(stock.quantity).toBe(30);
    expect(stock.stockStatus).toBe(DRUG_STOCK_STATUSES.IN_STOCK);
  });

  it('resolves the stock-on-hand setting once per distinct facility, not once per record in the batch', async () => {
    const otherReferenceData = await models.ReferenceData.create({
      ...fake(models.ReferenceData),
      type: REFERENCE_TYPES.DRUG,
    });
    const otherReferenceDrug = await models.ReferenceDrug.create({
      ...fake(models.ReferenceDrug),
      referenceDataId: otherReferenceData.id,
    });

    settingsCache.reset(); // force a cold cache so a per-record read would show up as a DB call
    const getSettingSpy = vi.spyOn(models.Setting, 'get');

    // Three records in one batch, two of them for the same facility.
    const changes = [
      {
        data: {
          id: `${referenceDrugId};${sohFacilityId}`,
          referenceDrugId,
          facilityId: sohFacilityId,
          quantity: 1,
          stockStatus: DRUG_STOCK_STATUSES.IN_STOCK,
        },
        isDeleted: false,
      },
      {
        data: {
          id: `${otherReferenceDrug.id};${sohFacilityId}`,
          referenceDrugId: otherReferenceDrug.id,
          facilityId: sohFacilityId,
          quantity: 2,
          stockStatus: DRUG_STOCK_STATUSES.IN_STOCK,
        },
        isDeleted: false,
      },
      {
        data: {
          id: `${otherReferenceDrug.id};${manualFacilityId}`,
          referenceDrugId: otherReferenceDrug.id,
          facilityId: manualFacilityId,
          quantity: 3,
          stockStatus: DRUG_STOCK_STATUSES.IN_STOCK,
        },
        isDeleted: false,
      },
    ];

    await saveChangesForModel(models.ReferenceDrugFacility, changes, false, log);

    // Two distinct facilities appear across three records, so this must resolve twice.
    const facilityScopeCalls = getSettingSpy.mock.calls.filter(
      ([, facilityId, scope]) =>
        scope === SETTINGS_SCOPES.FACILITY &&
        [sohFacilityId, manualFacilityId].includes(facilityId),
    );
    const facilityIdsQueried = facilityScopeCalls.map(([, facilityId]) => facilityId);
    expect(facilityIdsQueried).toHaveLength(2);
    expect(new Set(facilityIdsQueried)).toEqual(new Set([sohFacilityId, manualFacilityId]));

    getSettingSpy.mockRestore();
  });
});
