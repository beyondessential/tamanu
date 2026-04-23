import { write, utils } from 'xlsx';
import { importerTransaction } from '../../app/admin/importer/importerEndpoint';
import { referenceDataImporter } from '../../app/admin/referenceDataImporter';
import { createTestContext } from '../utilities';

function buildWorkbookBuffer(sheetName, headers, rows) {
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
      ws[cell] = typeof v === 'number' ? { t: 'n', v } : { t: 's', v: String(v) };
    });
  });

  ws['!ref'] = utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: rows.length, c: headers.length - 1 },
  });

  const wb = { SheetNames: [sheetName], Sheets: { [sheetName]: ws } };
  return write(wb, { type: 'buffer', bookType: 'xlsx' });
}

async function doImport(ctx, { buffer }) {
  return importerTransaction({
    importer: referenceDataImporter,
    data: buffer,
    models: ctx.store.models,
    includedDataTypes: ['invoicePriceList'],
    checkPermission: () => true,
  });
}

describe('Invoice price list import', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  }, 120 * 1000);

  afterAll(async () => {
    await ctx.close();
  });

  afterEach(async () => {
    const { InvoicePriceListItem, InvoicePriceList } = models;
    await InvoicePriceListItem.destroy({ where: {}, force: true });
    await InvoicePriceList.destroy({ where: {}, force: true });
  });

  const headers = ['id', 'code', 'name', 'rules', 'visibilityStatus'];

  it('parses rules JSON text into an object', async () => {
    const buffer = buildWorkbookBuffer('invoicePriceList', headers, [
      {
        id: 'pl-seniors',
        code: 'PL-SENIORS',
        name: 'Seniors',
        rules: '{ "facilityId": "facility-a", "patientAge": { "min": 65 } }',
        visibilityStatus: 'current',
      },
    ]);

    const { errors } = await doImport(ctx, { buffer });
    expect(errors).toEqual([]);

    const row = await models.InvoicePriceList.findByPk('pl-seniors');
    expect(row.rules).toEqual({
      facilityId: 'facility-a',
      patientAge: { min: 65 },
    });
    expect(row.rules.patientAge.min).toBe(65);
  });

  it('stores an empty rules cell as null', async () => {
    const buffer = buildWorkbookBuffer('invoicePriceList', headers, [
      {
        id: 'pl-default',
        code: 'PL-DEFAULT',
        name: 'Default',
        rules: '',
        visibilityStatus: 'current',
      },
    ]);

    const { errors } = await doImport(ctx, { buffer });
    expect(errors).toEqual([]);

    const row = await models.InvoicePriceList.findByPk('pl-default');
    expect(row.rules).toBeNull();
  });

  it('rejects malformed JSON (e.g. missing outer braces)', async () => {
    const buffer = buildWorkbookBuffer('invoicePriceList', headers, [
      {
        id: 'pl-bad',
        code: 'PL-BAD',
        name: 'Bad',
        rules: '"patientAge": { "max": 64 }',
        visibilityStatus: 'current',
      },
    ]);

    const { errors } = await doImport(ctx, { buffer });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toMatch(/rules is not valid JSON/);

    const row = await models.InvoicePriceList.findByPk('pl-bad');
    expect(row).toBeNull();
  });

  it('rejects unknown top-level keys in rules', async () => {
    const buffer = buildWorkbookBuffer('invoicePriceList', headers, [
      {
        id: 'pl-typo',
        code: 'PL-TYPO',
        name: 'Typo',
        rules: '{ "facility_id": "facility-a" }',
        visibilityStatus: 'current',
      },
    ]);

    const { errors } = await doImport(ctx, { buffer });
    expect(errors.length).toBeGreaterThan(0);

    const row = await models.InvoicePriceList.findByPk('pl-typo');
    expect(row).toBeNull();
  });

  it('rejects non-object rules (array, scalar)', async () => {
    const buffer = buildWorkbookBuffer('invoicePriceList', headers, [
      {
        id: 'pl-array',
        code: 'PL-ARRAY',
        name: 'Array',
        rules: '["patientAge"]',
        visibilityStatus: 'current',
      },
    ]);

    const { errors } = await doImport(ctx, { buffer });
    expect(errors.length).toBeGreaterThan(0);

    const row = await models.InvoicePriceList.findByPk('pl-array');
    expect(row).toBeNull();
  });

});
