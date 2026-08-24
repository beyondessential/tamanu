import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { DRUG_STOCK_STATUSES, REFERENCE_TYPES, SETTINGS_SCOPES } from '@tamanu/constants';
import { settingsCache } from '@tamanu/settings';
import { fake } from '@tamanu/fake-data/fake';
import { log } from '@tamanu/shared/services/logging/log';

import { saveChangesForModel } from '../../src/sync';
import { closeDatabase, createTestDatabase } from '../utilities';

// These exercise the facility-server side of sync (isCentralServer: false), where
// ReferenceDrugFacility.sanitizeForFacilityServer strips quantity/stockStatus out of
// anything central pushes down for a facility that treats mSupply as the stock-on-hand
// source of truth — so a sync pull (including a full resync) can never clobber the
// facility-local value that MSupplyStockOnHandProcessor maintains.
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
});
