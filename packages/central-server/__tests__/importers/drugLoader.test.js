import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { write, utils } from 'xlsx';
import { fake } from '@tamanu/fake-data/fake';
import { DRUG_STOCK_STATUSES, REFERENCE_TYPES, SETTINGS_SCOPES } from '@tamanu/constants';
import { settingsCache } from '@tamanu/settings';

import { importerTransaction } from '../../app/admin/importer/importerEndpoint';
import { referenceDataImporter } from '../../app/admin/referenceDataImporter';
import { drugLoaderFactory } from '../../app/admin/referenceDataImporter/loaders';
import { createTestContext } from '../utilities';

// Build a minimal XLSX workbook buffer with a single sheet called 'drug'.
// Facility columns are included via `defval: ''` on read, matching how mSupply-driven
// facilities can be present in the sheet with an empty stock value.
function buildDrugWorkbookBuffer(headers, rows) {
  const ws = {};

  headers.forEach((h, idx) => {
    const cell = utils.encode_cell({ r: 0, c: idx });
    ws[cell] = { t: 's', v: h };
  });

  rows.forEach((row, rIdx) => {
    headers.forEach((h, cIdx) => {
      const v = row[h];
      if (v === undefined) return;
      const cell = utils.encode_cell({ r: rIdx + 1, c: cIdx });
      const isNum = typeof v === 'number';
      ws[cell] = isNum ? { t: 'n', v } : { t: 's', v: String(v) };
    });
  });

  const range = {
    s: { r: 0, c: 0 },
    e: { r: rows.length, c: headers.length - 1 },
  };
  ws['!ref'] = utils.encode_range(range);

  const wb = { SheetNames: ['drug'], Sheets: { drug: ws } };
  return write(wb, { type: 'buffer', bookType: 'xlsx' });
}

describe('Drug import: stock on hand vs mSupply source of truth', () => {
  let ctx;
  let models;
  let manualFacilityId;
  let sohFacilityId;

  async function doImport(buffer) {
    return importerTransaction({
      importer: referenceDataImporter,
      data: buffer,
      models: ctx.store.models,
      includedDataTypes: ['drug'],
      checkPermission: () => true,
    });
  }

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;

    const manualFacility = await models.Facility.create({ ...fake(models.Facility) });
    manualFacilityId = manualFacility.id;

    const sohFacility = await models.Facility.create({ ...fake(models.Facility) });
    sohFacilityId = sohFacility.id;

    // This facility treats mSupply as the source of truth for stock on hand.
    await models.Setting.set(
      'integrations.mSupplyMed',
      { stockOnHandEnabled: true },
      SETTINGS_SCOPES.FACILITY,
      sohFacilityId,
    );
    settingsCache.reset();
  });

  afterAll(async () => {
    await ctx.close();
  });

  afterEach(async () => {
    await models.ReferenceDrugFacility.destroy({ where: {}, force: true });
    await models.ReferenceDrug.destroy({ where: {}, force: true });
    await models.ReferenceData.destroy({ where: { type: REFERENCE_TYPES.DRUG }, force: true });
  });

  it('sets stock levels from the sheet for a facility without mSupply stock-on-hand enabled', async () => {
    const headers = ['id', 'code', 'name', 'route', 'dosingUnit', manualFacilityId];
    const rows = [
      {
        id: 'drug-manual-1',
        code: 'DRUG-MANUAL-1',
        name: 'Manual Stock Drug',
        route: 'oral',
        dosingUnit: 'Tablet',
        [manualFacilityId]: 42,
      },
    ];

    const { errors } = await doImport(buildDrugWorkbookBuffer(headers, rows));
    expect(errors).toHaveLength(0);

    const referenceDrug = await models.ReferenceDrug.findOne({
      where: { referenceDataId: 'drug-manual-1' },
    });
    const stock = await models.ReferenceDrugFacility.findOne({
      where: { referenceDrugId: referenceDrug.id, facilityId: manualFacilityId },
    });

    expect(stock.quantity).toBe(42);
    expect(stock.stockStatus).toBe(DRUG_STOCK_STATUSES.IN_STOCK);
  });

  it('does not overwrite an existing stock level for a facility where mSupply is the source of truth', async () => {
    const headers = ['id', 'code', 'name', 'route', 'dosingUnit', sohFacilityId];
    const rows = [
      {
        id: 'drug-soh-1',
        code: 'DRUG-SOH-1',
        name: 'mSupply Stock Drug',
        route: 'oral',
        dosingUnit: 'Tablet',
        [sohFacilityId]: 999,
      },
    ];

    // Create the drug and its mSupply-sourced facility stock directly, as
    // MSupplyStockOnHandProcessor would.
    const referenceData = await models.ReferenceData.create({
      ...fake(models.ReferenceData),
      id: 'drug-soh-1',
      type: REFERENCE_TYPES.DRUG,
      code: 'DRUG-SOH-1',
      name: 'mSupply Stock Drug',
    });
    const referenceDrug = await models.ReferenceDrug.create({
      ...fake(models.ReferenceDrug),
      referenceDataId: referenceData.id,
    });
    await models.ReferenceDrugFacility.create({
      referenceDrugId: referenceDrug.id,
      facilityId: sohFacilityId,
      quantity: 7,
      stockStatus: DRUG_STOCK_STATUSES.IN_STOCK,
    });

    const { errors } = await doImport(buildDrugWorkbookBuffer(headers, rows));
    expect(errors).toHaveLength(0);

    const stock = await models.ReferenceDrugFacility.findOne({
      where: { referenceDrugId: referenceDrug.id, facilityId: sohFacilityId },
    });

    // Untouched by the import's 999, despite that value being in the sheet.
    expect(stock.quantity).toBe(7);
    expect(stock.stockStatus).toBe(DRUG_STOCK_STATUSES.IN_STOCK);
  });

  it('creates the facility association without a stock level on first import for an mSupply facility', async () => {
    const headers = ['id', 'code', 'name', 'route', 'dosingUnit', sohFacilityId];
    const rows = [
      {
        id: 'drug-soh-2',
        code: 'DRUG-SOH-2',
        name: 'mSupply New Drug',
        route: 'oral',
        dosingUnit: 'Tablet',
        [sohFacilityId]: 15,
      },
    ];

    const { errors } = await doImport(buildDrugWorkbookBuffer(headers, rows));
    expect(errors).toHaveLength(0);

    const referenceDrug = await models.ReferenceDrug.findOne({
      where: { referenceDataId: 'drug-soh-2' },
    });
    const stock = await models.ReferenceDrugFacility.findOne({
      where: { referenceDrugId: referenceDrug.id, facilityId: sohFacilityId },
    });

    // The association is created (so MSupplyStockOnHandProcessor's update can find it
    // later), but the sheet's quantity is ignored and the model default applies.
    expect(stock).not.toBeNull();
    expect(stock.quantity).toBeNull();
    expect(stock.stockStatus).toBe(DRUG_STOCK_STATUSES.UNKNOWN);
  });

  it('still updates other drug fields on import for a facility where mSupply owns stock on hand', async () => {
    const initialHeaders = ['id', 'code', 'name', 'route', 'dosingUnit', sohFacilityId];
    const initialRows = [
      {
        id: 'drug-soh-3',
        code: 'DRUG-SOH-3',
        name: 'Original Name',
        route: 'oral',
        dosingUnit: 'Tablet',
        [sohFacilityId]: 5,
      },
    ];
    const { errors: initialErrors } = await doImport(
      buildDrugWorkbookBuffer(initialHeaders, initialRows),
    );
    expect(initialErrors).toHaveLength(0);

    // The import never sets stock for this facility (even on first creation), so seed a
    // quantity directly, as MSupplyStockOnHandProcessor would have.
    const referenceDrugForSeed = await models.ReferenceDrug.findOne({
      where: { referenceDataId: 'drug-soh-3' },
    });
    await models.ReferenceDrugFacility.update(
      { quantity: 5, stockStatus: DRUG_STOCK_STATUSES.IN_STOCK },
      { where: { referenceDrugId: referenceDrugForSeed.id, facilityId: sohFacilityId } },
    );

    const updatedHeaders = ['id', 'code', 'name', 'route', 'dosingUnit', sohFacilityId];
    const updatedRows = [
      {
        id: 'drug-soh-3',
        code: 'DRUG-SOH-3',
        name: 'Updated Name',
        route: 'sublingual',
        dosingUnit: 'Capsule',
        [sohFacilityId]: 500,
      },
    ];
    const { errors } = await doImport(buildDrugWorkbookBuffer(updatedHeaders, updatedRows));
    expect(errors).toHaveLength(0);

    const referenceData = await models.ReferenceData.findByPk('drug-soh-3');
    const referenceDrug = await models.ReferenceDrug.findOne({
      where: { referenceDataId: 'drug-soh-3' },
    });
    const stock = await models.ReferenceDrugFacility.findOne({
      where: { referenceDrugId: referenceDrug.id, facilityId: sohFacilityId },
    });

    expect(referenceData.name).toBe('Updated Name');
    expect(referenceDrug.route).toBe('sublingual');
    expect(referenceDrug.dosingUnit).toBe('Capsule');
    // Stock level still untouched by the import despite the sheet now saying 500.
    expect(stock.quantity).toBe(5);
  });

  it('resolves the mSupply stock-on-hand setting a bounded number of times for a multi-row import', async () => {
    settingsCache.reset(); // force a cold cache so a per-row read would show up as a DB call
    const getSettingSpy = vi.spyOn(models.Setting, 'get');

    const headers = ['id', 'code', 'name', 'route', 'dosingUnit', sohFacilityId];
    const rows = ['drug-soh-4', 'drug-soh-5', 'drug-soh-6'].map((id, index) => ({
      id,
      code: `DRUG-SOH-${4 + index}`,
      name: `Drug ${4 + index}`,
      route: 'oral',
      dosingUnit: 'Tablet',
      [sohFacilityId]: 1,
    }));

    const { errors } = await doImport(buildDrugWorkbookBuffer(headers, rows));
    expect(errors).toHaveLength(0);

    // Isolated to the facility-scope query specifically (ignoring unrelated settings
    // reads elsewhere in the importer, e.g. importRows' own validateQuestionConfigs
    // check): three rows referencing the same facility must resolve it once, not
    // three times.
    const facilityScopeCalls = getSettingSpy.mock.calls.filter(
      ([, facilityId, scope]) => facilityId === sohFacilityId && scope === SETTINGS_SCOPES.FACILITY,
    );
    expect(facilityScopeCalls).toHaveLength(1);

    getSettingSpy.mockRestore();
  });
});

// The end-to-end test above can't cleanly prove drugLoaderFactory's own per-import cache
// is what's doing the work — the underlying ReadSettings/settingsCache layer already
// de-dupes repeated reads of a warm bucket on its own. This exercises the factory
// directly, with a cache invalidation forced strictly between two calls to the same
// loader instance, which only the loader's own cache (not settingsCache) can survive.
describe('drugLoaderFactory per-import cache', () => {
  let ctx;
  let models;
  let facilityId;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;

    const facility = await models.Facility.create({ ...fake(models.Facility) });
    facilityId = facility.id;
    await models.Setting.set(
      'integrations.mSupplyMed',
      { stockOnHandEnabled: true },
      SETTINGS_SCOPES.FACILITY,
      facilityId,
    );
    settingsCache.reset();
  });

  afterAll(async () => {
    await ctx.close();
  });

  afterEach(async () => {
    await models.ReferenceDrugFacility.destroy({ where: {}, force: true });
    await models.ReferenceDrug.destroy({ where: {}, force: true });
    await models.ReferenceData.destroy({ where: { type: REFERENCE_TYPES.DRUG }, force: true });
  });

  it('does not re-query settings for a facility already seen by this loader instance, even after an external cache invalidation', async () => {
    const drugLoader = drugLoaderFactory();
    const pushError = () => {};

    await drugLoader(
      { id: 'drug-cache-1', code: 'DRUG-CACHE-1', name: 'Drug 1', [facilityId]: 1 },
      { models, pushError },
    );

    // Simulate an external settings change elsewhere invalidating the shared cache
    // between rows — the kind of thing the loader-level cache must be immune to.
    settingsCache.reset();
    const getSettingSpy = vi.spyOn(models.Setting, 'get');

    const secondRowRows = await drugLoader(
      { id: 'drug-cache-2', code: 'DRUG-CACHE-2', name: 'Drug 2', [facilityId]: 1 },
      { models, pushError },
    );

    expect(getSettingSpy).not.toHaveBeenCalled();
    getSettingSpy.mockRestore();

    // drugLoader only builds rows; it doesn't write them (importRows does that later in
    // the real pipeline), so check the built row directly: still treated consistently
    // with the first row (stock skipped — no quantity/stockStatus keys) rather than
    // falling back to the "not source of truth" behaviour because the cache was cold.
    const facilityRow = secondRowRows.find(row => row.model === 'ReferenceDrugFacility');
    expect(facilityRow.values).not.toHaveProperty('quantity');
    expect(facilityRow.values).not.toHaveProperty('stockStatus');
  });

  it('a fresh loader instance (a new import) does re-query settings', async () => {
    const firstImportLoader = drugLoaderFactory();
    const pushError = () => {};
    await firstImportLoader(
      { id: 'drug-cache-3', code: 'DRUG-CACHE-3', name: 'Drug 3', [facilityId]: 1 },
      { models, pushError },
    );

    settingsCache.reset();
    const getSettingSpy = vi.spyOn(models.Setting, 'get');

    const secondImportLoader = drugLoaderFactory();
    await secondImportLoader(
      { id: 'drug-cache-4', code: 'DRUG-CACHE-4', name: 'Drug 4', [facilityId]: 1 },
      { models, pushError },
    );

    expect(getSettingSpy).toHaveBeenCalled();
    getSettingSpy.mockRestore();
  });
});
