import { write, utils } from 'xlsx';
import { fake } from '@tamanu/fake-data/fake';
import { importerTransaction } from '../../app/admin/importer/importerEndpoint';
import { referenceDataImporter } from '../../app/admin/referenceDataImporter';
import { createTestContext } from '../utilities';

// Build a minimal XLSX workbook buffer with a single sheet called 'invoicePriceListItem'
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

  const wb = { SheetNames: ['invoicePriceListItem'], Sheets: { invoicePriceListItem: ws } };
  return write(wb, { type: 'buffer', bookType: 'xlsx' });
}

async function doImport(ctx, { buffer }) {
  return importerTransaction({
    importer: referenceDataImporter,
    data: buffer,
    models: ctx.store.models,
    includedDataTypes: ['invoicePriceListItem'],
    checkPermission: () => true,
  });
}

describe('Invoice price list item import', () => {
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

  it('should create price list items from sheet headers and rows', async () => {
    const { InvoiceProduct, InvoicePriceList, InvoicePriceListItem } = models;

    // Create two products
    await InvoiceProduct.create({ ...fake(InvoiceProduct), id: 'prod-1' });
    await InvoiceProduct.create({ ...fake(InvoiceProduct), id: 'prod-2' });

    // Create two price lists
    await InvoicePriceList.create({ ...fake(InvoicePriceList), code: 'PL_A' });
    await InvoicePriceList.create({ ...fake(InvoicePriceList), code: 'PL_B' });

    const headers = ['invoiceProductId', 'PL_A', 'PL_B'];
    const rows = [
      { invoiceProductId: 'prod-1', PL_A: 100, PL_B: 200 },
      { invoiceProductId: 'prod-2', PL_A: 300, PL_B: 400 },
    ];
    const buffer = buildWorkbookBuffer(headers, rows);

    const { errors, stats } = await doImport(ctx, { buffer });
    expect(errors).toBeEmpty();

    // Expect 4 items created
    expect(stats).toMatchObject({
      InvoicePriceListItem: { created: 4, updated: 0, errored: 0 },
    });

    // Verify DB state
    const itemsProd1 = await InvoicePriceListItem.findAll({
      where: { invoiceProductId: 'prod-1' },
    });
    const itemsProd2 = await InvoicePriceListItem.findAll({
      where: { invoiceProductId: 'prod-2' },
    });

    expect(itemsProd1).toHaveLength(2);
    const pricesProd1 = itemsProd1.map(i => i.price).sort((a, b) => a - b);
    expect(pricesProd1).toEqual(['100', '200']);

    expect(itemsProd2).toHaveLength(2);
    const pricesProd2 = itemsProd2.map(i => i.price).sort((a, b) => a - b);
    expect(pricesProd2).toEqual(['300', '400']);
  });

  it('should create price list items from sheet headers and rows with special values', async () => {
    const { InvoiceProduct, InvoicePriceList, InvoicePriceListItem } = models;

    // Create two products
    await InvoiceProduct.create({ ...fake(InvoiceProduct), id: 'prod-1' });
    await InvoiceProduct.create({ ...fake(InvoiceProduct), id: 'prod-2' });

    // Create two price lists
    await InvoicePriceList.create({ ...fake(InvoicePriceList), code: 'PL_A' });
    await InvoicePriceList.create({ ...fake(InvoicePriceList), code: 'PL_B' });

    const headers = ['invoiceProductId', 'PL_A', 'PL_B'];
    const rows = [
      { invoiceProductId: 'prod-1', PL_A: 'hidden', PL_B: '' },
    ];
    const buffer = buildWorkbookBuffer(headers, rows);

    const { errors, stats } = await doImport(ctx, { buffer });
    expect(errors).toBeEmpty();

    // Expect 2 items created
    expect(stats).toMatchObject({
      InvoicePriceListItem: { created: 2, updated: 0, errored: 0 },
    });

    // Verify DB state
    const itemsProd1 = await InvoicePriceListItem.findAll({
      where: { invoiceProductId: 'prod-1' },
    });

    expect(itemsProd1).toHaveLength(2);
    const hiddenItem = itemsProd1.find(i => i.isHidden);
    expect(hiddenItem).toBeDefined();
    expect(hiddenItem.price).toBeNull();
    const visibleItem = itemsProd1.find(i => !i.isHidden);
    expect(visibleItem).toBeDefined();
    expect(visibleItem.price).toBeNull();
  });

  it('should treat plain numeric cells as fixed-price when the column header has the fixed token', async () => {
    const { InvoiceProduct, InvoicePriceList, InvoicePriceListItem } = models;

    await InvoiceProduct.create({ ...fake(InvoiceProduct), id: 'prod-1' });
    await InvoicePriceList.create({ ...fake(InvoicePriceList), code: 'PL_FIXED' });
    await InvoicePriceList.create({ ...fake(InvoicePriceList), code: 'PL_UNIT' });

    const headers = ['invoiceProductId', 'fixed PL_FIXED', 'PL_UNIT'];
    const rows = [{ invoiceProductId: 'prod-1', 'fixed PL_FIXED': 5, PL_UNIT: 10 }];
    const buffer = buildWorkbookBuffer(headers, rows);

    const { errors } = await doImport(ctx, { buffer });
    expect(errors).toBeEmpty();

    const items = await InvoicePriceListItem.findAll({ where: { invoiceProductId: 'prod-1' } });
    expect(items).toHaveLength(2);

    const fixedItem = items.find(i => Number(i.price) === 5);
    expect(fixedItem.isFixedPrice).toBe(true);
    expect(fixedItem.isHidden).toBe(false);

    const unitItem = items.find(i => Number(i.price) === 10);
    expect(unitItem.isFixedPrice).toBe(false);
    expect(unitItem.isHidden).toBe(false);
  });

  it('should treat the fixed header token case-insensitively', async () => {
    const { InvoiceProduct, InvoicePriceList, InvoicePriceListItem } = models;

    await InvoiceProduct.create({ ...fake(InvoiceProduct), id: 'prod-1' });
    await InvoicePriceList.create({ ...fake(InvoicePriceList), code: 'PL_A' });

    const headers = ['invoiceProductId', 'FIXED PL_A'];
    const rows = [{ invoiceProductId: 'prod-1', 'FIXED PL_A': 7 }];
    const buffer = buildWorkbookBuffer(headers, rows);

    const { errors } = await doImport(ctx, { buffer });
    expect(errors).toBeEmpty();

    const item = await InvoicePriceListItem.findOne({ where: { invoiceProductId: 'prod-1' } });
    expect(item.isFixedPrice).toBe(true);
    expect(Number(item.price)).toBe(7);
  });

  it('should treat an `f`-prefixed cell as a fixed-price override regardless of column default', async () => {
    const { InvoiceProduct, InvoicePriceList, InvoicePriceListItem } = models;

    await InvoiceProduct.create({ ...fake(InvoiceProduct), id: 'prod-1' });
    await InvoiceProduct.create({ ...fake(InvoiceProduct), id: 'prod-2' });
    await InvoicePriceList.create({ ...fake(InvoicePriceList), code: 'PL_A' });

    const headers = ['invoiceProductId', 'PL_A'];
    const rows = [
      { invoiceProductId: 'prod-1', PL_A: 'f2.50' },
      { invoiceProductId: 'prod-2', PL_A: 'F3' },
    ];
    const buffer = buildWorkbookBuffer(headers, rows);

    const { errors } = await doImport(ctx, { buffer });
    expect(errors).toBeEmpty();

    const item1 = await InvoicePriceListItem.findOne({ where: { invoiceProductId: 'prod-1' } });
    expect(item1.isFixedPrice).toBe(true);
    expect(Number(item1.price)).toBe(2.5);

    const item2 = await InvoicePriceListItem.findOne({ where: { invoiceProductId: 'prod-2' } });
    expect(item2.isFixedPrice).toBe(true);
    expect(Number(item2.price)).toBe(3);
  });

  it('should tolerate surrounding whitespace in `f`-prefixed cells', async () => {
    const { InvoiceProduct, InvoicePriceList, InvoicePriceListItem } = models;

    await InvoiceProduct.create({ ...fake(InvoiceProduct), id: 'prod-1' });
    await InvoicePriceList.create({ ...fake(InvoicePriceList), code: 'PL_A' });

    const headers = ['invoiceProductId', 'PL_A'];
    const rows = [{ invoiceProductId: 'prod-1', PL_A: '  f 4.25  ' }];
    const buffer = buildWorkbookBuffer(headers, rows);

    const { errors } = await doImport(ctx, { buffer });
    expect(errors).toBeEmpty();

    const item = await InvoicePriceListItem.findOne({ where: { invoiceProductId: 'prod-1' } });
    expect(item.isFixedPrice).toBe(true);
    expect(Number(item.price)).toBe(4.25);
  });

  it('should reject cells where the fixed prefix is not followed by a valid number', async () => {
    const { InvoiceProduct, InvoicePriceList } = models;

    await InvoiceProduct.create({ ...fake(InvoiceProduct), id: 'prod-1' });
    await InvoicePriceList.create({ ...fake(InvoicePriceList), code: 'PL_A' });

    const headers = ['invoiceProductId', 'PL_A'];
    const rows = [{ invoiceProductId: 'prod-1', PL_A: 'fabc' }];
    const buffer = buildWorkbookBuffer(headers, rows);

    const { didntSendReason } = await doImport(ctx, { buffer });
    expect(didntSendReason).toEqual('validationFailed');
  });

  it('should validate non-numeric price values', async () => {
    const { InvoiceProduct, InvoicePriceList } = models;

    await InvoiceProduct.create({ ...fake(InvoiceProduct), id: 'prod-3' });
    await InvoicePriceList.create({ ...fake(InvoicePriceList), code: 'PL_A' });

    const headers = ['invoiceProductId', 'PL_A'];
    const rows = [{ invoiceProductId: 'prod-3', PL_A: 'abc' }];
    const buffer = buildWorkbookBuffer(headers, rows);

    const { didntSendReason, errors, stats } = await doImport(ctx, { buffer });
    expect(didntSendReason).toEqual('validationFailed');
    expect(stats).toEqual({
      InvoicePriceListItem: {
        created: 0,
        deleted: 0,
        errored: 1,
        restored: 0,
        skipped: 0,
        updated: 0,
      },
    });
    expect(errors[0]).toHaveProperty(
      'message',
      "Invalid price value 'abc' for priceList 'PL_A' and invoiceProductId 'prod-3' on invoicePriceListItem at row 2",
    );
  });

  it('should error if price list does not exist', async () => {
    const { InvoiceProduct } = models;

    await InvoiceProduct.create({ ...fake(InvoiceProduct), id: 'prod-4' });

    const headers = ['invoiceProductId', 'NONEXISTENT_PL'];
    const rows = [{ invoiceProductId: 'prod-4', NONEXISTENT_PL: 100 }];
    const buffer = buildWorkbookBuffer(headers, rows);

    const { didntSendReason, errors, stats } = await doImport(ctx, { buffer });
    expect(didntSendReason).toEqual('validationFailed');
    expect(stats).toEqual({
      InvoicePriceListItem: {
        created: 0,
        deleted: 0,
        errored: 2,
        restored: 0,
        skipped: 0,
        updated: 0,
      },
    });
    expect(errors[0]).toHaveProperty(
      'message',
      "InvoicePriceList with code 'NONEXISTENT_PL' does not exist on invoicePriceListItem at row 2",
    );
  });

  it('should error if invoice product does not exist', async () => {
    const { InvoicePriceList } = models;

    await InvoicePriceList.create({ ...fake(InvoicePriceList), code: 'PL_A' });

    const headers = ['invoiceProductId', 'PL_A'];
    const rows = [{ invoiceProductId: 'nonexistent-product', PL_A: 100 }];
    const buffer = buildWorkbookBuffer(headers, rows);

    const { didntSendReason, errors, stats } = await doImport(ctx, { buffer });
    expect(didntSendReason).toEqual('validationFailed');
    expect(stats).toEqual({
      InvoicePriceListItem: {
        created: 0,
        deleted: 0,
        errored: 1,
        restored: 0,
        skipped: 0,
        updated: 0,
      },
    });
    expect(errors[0]).toHaveProperty(
      'message',
      "Invoice product 'nonexistent-product' does not exist on invoicePriceListItem at row 2",
    );
  });

  it('should error on duplicate price list codes in headers', async () => {
    const { InvoiceProduct, InvoicePriceList } = models;

    await InvoiceProduct.create({ ...fake(InvoiceProduct), id: 'prod-5' });
    await InvoicePriceList.create({ ...fake(InvoicePriceList), code: 'PL_A' });

    const headers = ['invoiceProductId', 'PL_A', 'PL_A'];
    const rows = [{ invoiceProductId: 'prod-5', PL_A: 100 }];
    const buffer = buildWorkbookBuffer(headers, rows);

    const { didntSendReason } = await doImport(ctx, { buffer });
    expect(didntSendReason).toEqual('validationFailed');
  });

  it('should detect updated decimal values on re-import', async () => {
    const { InvoiceProduct, InvoicePriceList, InvoicePriceListItem } = models;

    await InvoiceProduct.create({ ...fake(InvoiceProduct), id: 'prod-1' });
    await InvoicePriceList.create({ ...fake(InvoicePriceList), code: 'PL_A' });

    const headers = ['invoiceProductId', 'PL_A'];
    const initialRows = [{ invoiceProductId: 'prod-1', PL_A: 100 }];
    const initialBuffer = buildWorkbookBuffer(headers, initialRows);

    const { errors: createErrors, stats: createStats } = await doImport(ctx, {
      buffer: initialBuffer,
    });
    expect(createErrors).toBeEmpty();
    expect(createStats).toMatchObject({
      InvoicePriceListItem: { created: 1 },
    });

    // Re-import with a changed price
    const updatedRows = [{ invoiceProductId: 'prod-1', PL_A: 200 }];
    const updatedBuffer = buildWorkbookBuffer(headers, updatedRows);

    const { errors: updateErrors, stats: updateStats } = await doImport(ctx, {
      buffer: updatedBuffer,
    });
    expect(updateErrors).toBeEmpty();
    expect(updateStats).toMatchObject({
      InvoicePriceListItem: { updated: 1 },
    });

    const items = await InvoicePriceListItem.findAll({
      where: { invoiceProductId: 'prod-1' },
    });
    expect(items).toHaveLength(1);
    expect(Number(items[0].price)).toBe(200);
  });

  it('should skip unchanged decimal values on re-import', async () => {
    const { InvoiceProduct, InvoicePriceList } = models;

    await InvoiceProduct.create({ ...fake(InvoiceProduct), id: 'prod-1' });
    await InvoicePriceList.create({ ...fake(InvoicePriceList), code: 'PL_A' });

    const headers = ['invoiceProductId', 'PL_A'];
    const rows = [{ invoiceProductId: 'prod-1', PL_A: 100 }];
    const buffer = buildWorkbookBuffer(headers, rows);

    const { errors: createErrors } = await doImport(ctx, { buffer });
    expect(createErrors).toBeEmpty();

    // Re-import with the same price
    const { errors: reimportErrors, stats: reimportStats } = await doImport(ctx, { buffer });
    expect(reimportErrors).toBeEmpty();
    expect(reimportStats).toMatchObject({
      InvoicePriceListItem: { skipped: 1, updated: 0 },
    });
  });

  it('should error if invoiceProductId column is missing', async () => {
    const { InvoicePriceList } = models;

    await InvoicePriceList.create({ ...fake(InvoicePriceList), code: 'PL_A' });

    const headers = ['productId', 'PL_A']; // wrong column name
    const rows = [{ productId: 'prod-6', PL_A: 100 }];
    const buffer = buildWorkbookBuffer(headers, rows);

    const { didntSendReason, errors, stats } = await doImport(ctx, { buffer });
    expect(didntSendReason).toEqual('validationFailed');
    expect(stats).toEqual({
      InvoicePriceListItem: {
        created: 0,
        deleted: 0,
        errored: 1,
        restored: 0,
        skipped: 0,
        updated: 0,
      },
    });
    expect(errors[0]).toHaveProperty(
      'message',
      'Missing required column: invoiceProductId on invoicePriceListItem at row 2',
    );
  });
});
