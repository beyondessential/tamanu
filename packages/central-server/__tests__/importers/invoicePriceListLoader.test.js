import { write, utils } from 'xlsx';
import { fake } from '@tamanu/fake-data/fake';
import { importerTransaction } from '../../dist/admin/importer/importerEndpoint';
import { referenceDataImporter } from '../../dist/admin/referenceDataImporter';
import { createTestContext } from '../utilities';

// Build a minimal XLSX workbook buffer with a single sheet called 'invoicePriceList'
function buildWorkbookBuffer(headers, rows) {
  const ws = {};

  // set headers
  headers.forEach((h, idx) => {
    const cell = utils.encode_cell({ r: 0, c: idx });
    ws[cell] = { t: 's', v: h };
  });

  // set rows
  rows.forEach((row, rIdx) => {
    headers.forEach((h, cIdx) => {
      const v = row[h];
      if (v === undefined) return;
      const cell = utils.encode_cell({ r: rIdx + 1, c: cIdx });
      const isNum = typeof v === 'number';
      ws[cell] = isNum ? { t: 'n', v } : { t: 's', v: String(v) };
    });
  });

  // set range
  const range = {
    s: { r: 0, c: 0 },
    e: { r: rows.length + 1, c: headers.length - 1 },
  };
  ws['!ref'] = utils.encode_range(range);

  const wb = { SheetNames: ['invoicePriceList'], Sheets: { invoicePriceList: ws } };
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
  });

  afterAll(async () => {
    await ctx.close();
  });

  afterEach(async () => {
    const { InvoicePriceListItem, InvoicePriceList, InvoiceProduct } = models;
    await InvoicePriceListItem.destroy({ where: {}, force: true });
    await InvoicePriceList.destroy({ where: {}, force: true });
    await InvoiceProduct.destroy({ where: {}, force: true });
  });

  it('should create price lists and items from sheet headers and rows', async () => {
    const { InvoiceProduct, InvoicePriceList, InvoicePriceListItem } = models;

    // Create two products
    await InvoiceProduct.create({ ...fake(InvoiceProduct), id: 'prod-1' });
    await InvoiceProduct.create({ ...fake(InvoiceProduct), id: 'prod-2' });

    const headers = ['invoiceProductId', 'PL_A', 'PL_B'];
    const rows = [
      { invoiceProductId: 'prod-1', PL_A: 100, PL_B: 200 },
      { invoiceProductId: 'prod-2', PL_A: '', PL_B: 300 }, // blank should be ignored
    ];
    const buffer = buildWorkbookBuffer(headers, rows);

    const { errors, stats } = await doImport(ctx, { buffer });
    expect(errors).toBeEmpty();

    // Expect 2 price lists created and 3 items
    expect(stats).toMatchObject({
      InvoicePriceList: { created: 2, updated: 0, errored: 0 },
      InvoicePriceListItem: { created: 3, updated: 0, errored: 0 },
    });

    // Verify DB state
    const plA = await InvoicePriceList.findOne({ where: { code: 'PL_A' } });
    const plB = await InvoicePriceList.findOne({ where: { code: 'PL_B' } });
    expect(plA).toBeTruthy();
    expect(plB).toBeTruthy();

    const itemsProd1 = await InvoicePriceListItem.findAll({
      where: { invoiceProductId: 'prod-1' },
    });
    const itemsProd2 = await InvoicePriceListItem.findAll({
      where: { invoiceProductId: 'prod-2' },
    });

    expect(itemsProd1).toHaveLength(2);
    const pricesProd1 = itemsProd1.map(i => i.price).sort((a, b) => a - b);
    expect(pricesProd1).toEqual(['100', '200']);

    expect(itemsProd2).toHaveLength(1);
    expect(itemsProd2[0].price).toEqual('300');
  });

  it('should validate non-numeric price values', async () => {
    const { InvoiceProduct } = models;

    await InvoiceProduct.create({ ...fake(InvoiceProduct), id: 'prod-3' });

    const headers = ['invoiceProductId', 'PL_A'];
    const rows = [{ invoiceProductId: 'prod-3', PL_A: 'abc' }];
    const buffer = buildWorkbookBuffer(headers, rows);

    const { didntSendReason, errors, stats } = await doImport(ctx, { buffer });
    expect(didntSendReason).toEqual('validationFailed');
    expect(stats).toEqual({});
    expect(errors[0]).toHaveProperty(
      'message',
      "Invalid price value 'abc' for priceList 'PL_A' and invoiceProductId 'prod-3' on invoicePriceList at row 2",
    );
  });

  it('should error when invoiceProductId header is missing', async () => {
    const { InvoiceProduct } = models;

    await InvoiceProduct.create({ ...fake(InvoiceProduct), id: 'prod-4' });

    // No invoiceProductId column
    const headers = ['PL_ONLY'];
    const rows = [{ PL_ONLY: 50 }];
    const buffer = buildWorkbookBuffer(headers, rows);

    const { didntSendReason, errors } = await doImport(ctx, { buffer });
    expect(didntSendReason).toEqual('validationFailed');
    expect(errors[0]).toHaveProperty(
      'message',
      'Missing required column: invoiceProductId on invoicePriceList at row 2',
    );
  });
});
