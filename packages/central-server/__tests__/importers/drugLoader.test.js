import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { write, utils } from 'xlsx';
import { fake } from '@tamanu/fake-data/fake';
import {
  DRUG_ROUTE_VALUES,
  DRUG_STOCK_STATUSES,
  REFERENCE_TYPES,
  SETTINGS_SCOPES,
} from '@tamanu/constants';
import { settingsCache } from '@tamanu/settings';

import { importerTransaction } from '../../app/admin/importer/importerEndpoint';
import { referenceDataImporter } from '../../app/admin/referenceDataImporter';
import { drugLoaderFactory } from '../../app/admin/referenceDataImporter/loaders';
import { createTestContext } from '../utilities';

function buildSheet(headers, rows) {
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
  return ws;
}

// Build a minimal XLSX workbook buffer from `{ [sheetName]: { headers, rows } }`.
function buildWorkbookBuffer(sheets) {
  const wb = {
    SheetNames: Object.keys(sheets),
    Sheets: Object.fromEntries(
      Object.entries(sheets).map(([name, { headers, rows }]) => [name, buildSheet(headers, rows)]),
    ),
  };
  return write(wb, { type: 'buffer', bookType: 'xlsx' });
}

// Build a minimal XLSX workbook buffer with a single sheet called 'drug'.
// Facility columns are included via `defval: ''` on read, matching how mSupply-driven
// facilities can be present in the sheet with an empty stock value.
function buildDrugWorkbookBuffer(headers, rows) {
  return buildWorkbookBuffer({ drug: { headers, rows } });
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

    // Isolated to the facility-scope query (ignoring importRows' own unrelated settings
    // read): three rows for the same facility must resolve it once, not three times.
    const facilityScopeCalls = getSettingSpy.mock.calls.filter(
      ([, facilityId, scope]) => facilityId === sohFacilityId && scope === SETTINGS_SCOPES.FACILITY,
    );
    expect(facilityScopeCalls).toHaveLength(1);

    getSettingSpy.mockRestore();
  });

  // A drug with no ReferenceDrug record behind it exports with every drug column blank, and has
  // to survive being imported back.
  it('imports a row whose drug columns are all blank', async () => {
    const headers = [
      'id',
      'code',
      'name',
      'route',
      'dosingUnit',
      'dispensingUnit',
      'unitConversion',
      'notes',
      manualFacilityId,
    ];
    const rows = [{ id: 'drug-blank-1', code: 'DRUG-BLANK-1', name: 'Blank Drug' }];

    const { errors } = await doImport(buildDrugWorkbookBuffer(headers, rows));
    expect(errors).toHaveLength(0);

    const referenceDrug = await models.ReferenceDrug.findOne({
      where: { referenceDataId: 'drug-blank-1' },
    });
    expect(referenceDrug.route).toBeNull();
    expect(referenceDrug.dosingUnit).toBeNull();
    expect(referenceDrug.dispensingUnit).toBeNull();
    expect(referenceDrug.notes).toBeNull();
    expect(Number(referenceDrug.unitConversion)).toBe(1);

    // The facility column is blank on this row, so its association is still written with no stock.
    const stock = await models.ReferenceDrugFacility.findOne({
      where: { referenceDrugId: referenceDrug.id, facilityId: manualFacilityId },
    });
    expect(stock.quantity).toBeNull();
    expect(stock.stockStatus).toBe(DRUG_STOCK_STATUSES.UNKNOWN);
  });

  // The importer used to write route through unchecked while the admin panel's Manage tab
  // validated it on save, so a drug imported with an unrecognised route could not be edited
  // there at all — not even to change its name — until someone re-picked the route by hand.
  describe('route validation', () => {
    const headers = ['id', 'code', 'name', 'route'];

    it.each([
      ['the stored value', 'oral', 'oral'],
      ['the label the admin panel shows', 'Oral', 'oral'],
      ['a label that is not just a case variant', 'IM', 'intramuscular'],
      ['a label containing punctuation', 'S/C', 'subcutaneous'],
    ])('accepts %s and stores the enum value', async (_description, sheetValue, stored) => {
      const rows = [
        { id: 'drug-route-ok', code: 'DRUG-ROUTE-OK', name: 'Route Drug', route: sheetValue },
      ];

      const { errors } = await doImport(buildDrugWorkbookBuffer(headers, rows));
      expect(errors).toHaveLength(0);

      const referenceDrug = await models.ReferenceDrug.findOne({
        where: { referenceDataId: 'drug-route-ok' },
      });
      expect(referenceDrug.route).toBe(stored);
      // The whole point: what was stored is editable through Manage, which checks this enum.
      expect(DRUG_ROUTE_VALUES).toContain(referenceDrug.route);
    });

    it.each([
      ['a case variant that is not the label', 'ORAL'],
      ['a value that is not a route at all', 'by mouth'],
    ])('rejects %s against the sheet and row', async (_description, sheetValue) => {
      const rows = [
        { id: 'drug-route-good', code: 'DRUG-ROUTE-GOOD', name: 'Good Route', route: 'oral' },
        { id: 'drug-route-bad', code: 'DRUG-ROUTE-BAD', name: 'Bad Route', route: sheetValue },
      ];

      const { errors } = await doImport(buildDrugWorkbookBuffer(headers, rows));

      expect(errors).toHaveLength(1);
      // Row 3: the second data row, once the header row is counted.
      expect(errors[0].message).toMatch(/^route must be one of.* on drug at row 3$/);

      // The import rolls back wholesale on any error, so the bad value never reaches a record
      // Manage would then refuse to save — and neither does the valid row sharing the sheet.
      expect(await models.ReferenceDrug.count()).toBe(0);
      expect(await models.ReferenceData.findByPk('drug-route-bad')).toBeNull();
    });
  });

  // spec: DQLIM#configuring-limits
  describe('dose and dispensing quantity limits', () => {
    const limitHeaders = [
      'id',
      'code',
      'name',
      'dosingUnit',
      'dispensingUnit',
      'doseMin',
      'doseMax',
      'dispensingQuantityMin',
      'dispensingQuantityMax',
    ];
    const drugRow = overrides => ({
      id: 'drug-limits',
      code: 'DRUG-LIMITS',
      name: 'Limits Drug',
      dosingUnit: 'Tablet',
      dispensingUnit: 'Tablet',
      ...overrides,
    });
    const findLimits = async id => {
      const referenceDrug = await models.ReferenceDrug.findOne({ where: { referenceDataId: id } });
      return {
        doseMin: referenceDrug.doseMin === null ? null : Number(referenceDrug.doseMin),
        doseMax: referenceDrug.doseMax === null ? null : Number(referenceDrug.doseMax),
        dispensingQuantityMin: referenceDrug.dispensingQuantityMin,
        dispensingQuantityMax: referenceDrug.dispensingQuantityMax,
      };
    };

    it('imports each limit, reading the limit columns as drug fields rather than facilities', async () => {
      const rows = [
        drugRow({ doseMin: 0.5, doseMax: 2, dispensingQuantityMin: 1, dispensingQuantityMax: 100 }),
      ];

      const { errors } = await doImport(buildDrugWorkbookBuffer(limitHeaders, rows));
      expect(errors).toHaveLength(0);

      expect(await findLimits('drug-limits')).toEqual({
        doseMin: 0.5,
        doseMax: 2,
        dispensingQuantityMin: 1,
        dispensingQuantityMax: 100,
      });
      expect(await models.ReferenceDrugFacility.count()).toBe(0);
    });

    it('leaves a blank limit unset, and clears a limit blanked on re-import', async () => {
      await doImport(buildDrugWorkbookBuffer(limitHeaders, [drugRow({ doseMax: 2 })]));
      expect(await findLimits('drug-limits')).toEqual({
        doseMin: null,
        doseMax: 2,
        dispensingQuantityMin: null,
        dispensingQuantityMax: null,
      });

      const { errors } = await doImport(
        buildDrugWorkbookBuffer(limitHeaders, [drugRow({ dispensingQuantityMax: 30 })]),
      );
      expect(errors).toHaveLength(0);
      expect(await findLimits('drug-limits')).toEqual({
        doseMin: null,
        doseMax: null,
        dispensingQuantityMin: null,
        dispensingQuantityMax: 30,
      });
    });

    it('accepts a minimum equal to its maximum', async () => {
      const rows = [drugRow({ doseMin: 1, doseMax: 1 })];
      const { errors } = await doImport(buildDrugWorkbookBuffer(limitHeaders, rows));
      expect(errors).toHaveLength(0);
    });

    it.each([
      ['a negative limit', { doseMin: -1 }, 'doseMin must be 0 or more'],
      [
        'a dispensing quantity limit that is not a whole number',
        { dispensingQuantityMax: 2.5 },
        'dispensingQuantityMax must be a whole number',
      ],
      [
        'a minimum greater than its maximum',
        { doseMin: 3, doseMax: 2 },
        'doseMin must not be greater than doseMax',
      ],
    ])('rejects the row for %s', async (_description, limits, message) => {
      const rows = [drugRow(limits)];

      const { errors } = await doImport(buildDrugWorkbookBuffer(limitHeaders, rows));

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe(`Drug "drug-limits": ${message}. on drug at row 2`);
      expect(await models.ReferenceDrug.count()).toBe(0);
    });
  });

  // spec: DQLIM#medication-sets
  describe('medication template doses against drug dose limits', () => {
    const drugHeaders = [
      'id',
      'code',
      'name',
      'dosingUnit',
      'doseMin',
      'doseMax',
      'dispensingQuantityMax',
    ];
    const templateHeaders = [
      'id',
      'code',
      'name',
      'medication',
      'doseAmount',
      'dosingUnit',
      'frequency',
      'route',
      'dischargeQuantity',
    ];
    const drugRows = [
      {
        id: 'drug-template-limits',
        code: 'DRUG-TEMPLATE-LIMITS',
        name: 'Template Limits Drug',
        dosingUnit: 'Tablet',
        doseMin: 1,
        doseMax: 2,
        dispensingQuantityMax: 10,
      },
    ];
    const templateRow = overrides => ({
      id: 'medicationtemplate-limits',
      code: 'TEMPLATE-LIMITS',
      name: 'Template Limits',
      medication: 'drug-template-limits',
      doseAmount: 1,
      dosingUnit: 'Tablet',
      frequency: 'Daily',
      route: 'oral',
      ...overrides,
    });
    const importWithTemplate = template =>
      importerTransaction({
        importer: referenceDataImporter,
        data: buildWorkbookBuffer({
          drug: { headers: drugHeaders, rows: drugRows },
          'Medication Template': { headers: templateHeaders, rows: [template] },
        }),
        models: ctx.store.models,
        includedDataTypes: ['drug', 'medicationTemplate'],
        checkPermission: () => true,
      });

    afterEach(async () => {
      await models.ReferenceMedicationTemplate.destroy({ where: {}, force: true });
      await models.ReferenceData.destroy({
        where: { type: REFERENCE_TYPES.MEDICATION_TEMPLATE },
        force: true,
      });
    });

    it.each([
      ['within the limits', 2],
      ['on a limit', 1],
      ['variable', 'variable'],
    ])('imports a template whose dose is %s', async (_description, doseAmount) => {
      const { errors } = await importWithTemplate(templateRow({ doseAmount }));
      expect(errors).toHaveLength(0);
      expect(await models.ReferenceMedicationTemplate.count()).toBe(1);
    });

    it('does not check the discharge quantity against the dispensing quantity limits', async () => {
      const { errors } = await importWithTemplate(templateRow({ dischargeQuantity: 50 }));
      expect(errors).toHaveLength(0);
    });

    it.each([
      [
        'above the maximum',
        3,
        'Dose amount 3 is above the maximum dose of 2 for drug "drug-template-limits".',
      ],
      [
        'below the minimum',
        0.5,
        'Dose amount 0.5 is below the minimum dose of 1 for drug "drug-template-limits".',
      ],
    ])(
      'rejects a template whose dose is %s, using limits from the same workbook',
      async (_description, doseAmount, message) => {
        const { errors } = await importWithTemplate(templateRow({ doseAmount }));

        expect(errors.map(error => error.message)).toEqual([
          `${message} on medicationTemplate at row 2`,
        ]);
        expect(await models.ReferenceMedicationTemplate.count()).toBe(0);
      },
    );
  });

  // The test above can't cleanly prove drugLoaderFactory's own cache is what's doing the
  // work — ReadSettings' cache already de-dupes repeated reads of a warm bucket on its
  // own. This forces a cache invalidation strictly between two calls to the same loader
  // instance, which only the loader's own cache (not ReadSettings') can survive.
  describe('drugLoaderFactory per-import cache', () => {
    it('does not re-query settings for a facility already seen by this loader instance, even after an external cache invalidation', async () => {
      const drugLoader = drugLoaderFactory();
      const pushError = () => {};

      await drugLoader(
        { id: 'drug-cache-1', code: 'DRUG-CACHE-1', name: 'Drug 1', [sohFacilityId]: 1 },
        { models, pushError, header: ['id', 'code', 'name', sohFacilityId] },
      );

      // Simulate an external settings change invalidating the shared cache between rows.
      settingsCache.reset();
      const getSettingSpy = vi.spyOn(models.Setting, 'get');

      const secondRowRows = await drugLoader(
        { id: 'drug-cache-2', code: 'DRUG-CACHE-2', name: 'Drug 2', [sohFacilityId]: 1 },
        { models, pushError, header: ['id', 'code', 'name', sohFacilityId] },
      );

      expect(getSettingSpy).not.toHaveBeenCalled();
      getSettingSpy.mockRestore();

      // drugLoader only builds rows, it doesn't write them, so check the built row
      // directly: still stock-skipped like the first row, not falling back because the
      // cache was cold.
      const facilityRow = secondRowRows.find(row => row.model === 'ReferenceDrugFacility');
      expect(facilityRow.values).not.toHaveProperty('quantity');
      expect(facilityRow.values).not.toHaveProperty('stockStatus');
    });

    it('a fresh loader instance (a new import) does re-query settings', async () => {
      const firstImportLoader = drugLoaderFactory();
      const pushError = () => {};
      await firstImportLoader(
        { id: 'drug-cache-3', code: 'DRUG-CACHE-3', name: 'Drug 3', [sohFacilityId]: 1 },
        { models, pushError, header: ['id', 'code', 'name', sohFacilityId] },
      );

      settingsCache.reset();
      const getSettingSpy = vi.spyOn(models.Setting, 'get');

      const secondImportLoader = drugLoaderFactory();
      await secondImportLoader(
        { id: 'drug-cache-4', code: 'DRUG-CACHE-4', name: 'Drug 4', [sohFacilityId]: 1 },
        { models, pushError, header: ['id', 'code', 'name', sohFacilityId] },
      );

      expect(getSettingSpy).toHaveBeenCalled();
      getSettingSpy.mockRestore();
    });
  });
});
