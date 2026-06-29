import { write, utils } from 'xlsx';
import { keyBy } from 'lodash';
import { INVOICE_ITEMS_CATEGORIES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { importerTransaction } from '../../app/admin/importer/importerEndpoint';
import { referenceDataImporter } from '../../app/admin/referenceDataImporter';
import { createTestContext } from '../utilities';

// Build an XLSX workbook with one matrix sheet per entry: { sheetName: { headers, rows } }.
function buildWorkbook(sheets) {
  const SheetNames = [];
  const Sheets = {};
  for (const [sheetName, { headers, rows }] of Object.entries(sheets)) {
    const ws = {};
    headers.forEach((h, idx) => {
      ws[utils.encode_cell({ r: 0, c: idx })] = { t: 's', v: h };
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
      e: { r: rows.length + 1, c: headers.length - 1 },
    });
    SheetNames.push(sheetName);
    Sheets[sheetName] = ws;
  }
  return write({ SheetNames, Sheets }, { type: 'buffer', bookType: 'xlsx' });
}

async function doImport(ctx, buffer, includedDataTypes) {
  return importerTransaction({
    importer: referenceDataImporter,
    data: buffer,
    models: ctx.store.models,
    includedDataTypes,
    checkPermission: () => true,
  });
}

describe('Invoice price list charging import', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(async () => ctx.close());

  afterEach(async () => {
    const { InvoicePriceListItem, InvoicePriceList, InvoiceProduct } = models;
    await InvoicePriceListItem.destroy({ where: {}, force: true });
    await InvoicePriceList.destroy({ where: {}, force: true });
    await InvoiceProduct.destroy({ where: {}, force: true });
  });

  const createProduct = (id, category) =>
    models.InvoiceProduct.create({ ...fake(models.InvoiceProduct), id, category });
  const createMedication = id => createProduct(id, INVOICE_ITEMS_CATEGORIES.DRUG);
  const createNonMedication = id => createProduct(id, INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE);

  it('sets isFixedPrice from the charging sheet and merges onto the price-list items', async () => {
    const { InvoicePriceList, InvoicePriceListItem } = models;
    await createMedication('prod-1');
    await createMedication('prod-2');
    await InvoicePriceList.create({ ...fake(InvoicePriceList), code: 'KOSRAE' });

    const buffer = buildWorkbook({
      invoicePriceListItem: {
        headers: ['invoiceProductId', 'KOSRAE'],
        rows: [
          { invoiceProductId: 'prod-1', KOSRAE: 2 },
          { invoiceProductId: 'prod-2', KOSRAE: 0.5 },
        ],
      },
      invoicePriceListCharging: {
        headers: ['invoiceProductId', 'KOSRAE'],
        rows: [
          { invoiceProductId: 'prod-1', KOSRAE: 'flatFee' },
          { invoiceProductId: 'prod-2', KOSRAE: 'perUnit' },
        ],
      },
    });

    const { errors } = await doImport(ctx, buffer, [
      'invoicePriceListItem',
      'invoicePriceListCharging',
    ]);
    expect(errors).toBeEmpty();

    const items = await InvoicePriceListItem.findAll();
    expect(items).toHaveLength(2); // charging merged onto the same rows, not duplicated
    const byProduct = keyBy(items, 'invoiceProductId');
    expect(byProduct['prod-1'].isFixedPrice).toBe(true);
    expect(Number(byProduct['prod-1'].price)).toBe(2); // price preserved
    expect(byProduct['prod-2'].isFixedPrice).toBe(false);
    expect(Number(byProduct['prod-2'].price)).toBe(0.5);
  });

  it('is case-insensitive on flatFee/perUnit', async () => {
    const { InvoicePriceList, InvoicePriceListItem } = models;
    await createMedication('prod-1');
    await InvoicePriceList.create({ ...fake(InvoicePriceList), code: 'KOSRAE' });

    const buffer = buildWorkbook({
      invoicePriceListCharging: {
        headers: ['invoiceProductId', 'KOSRAE'],
        rows: [{ invoiceProductId: 'prod-1', KOSRAE: 'FlatFee' }],
      },
    });

    const { errors } = await doImport(ctx, buffer, ['invoicePriceListCharging']);
    expect(errors).toBeEmpty();
    const item = await InvoicePriceListItem.findOne({ where: { invoiceProductId: 'prod-1' } });
    expect(item.isFixedPrice).toBe(true);
  });

  it('errors on a blank charging cell (explicit value required)', async () => {
    const { InvoicePriceList } = models;
    await createMedication('prod-1');
    await InvoicePriceList.create({ ...fake(InvoicePriceList), code: 'KOSRAE' });

    const buffer = buildWorkbook({
      invoicePriceListCharging: {
        headers: ['invoiceProductId', 'KOSRAE'],
        rows: [{ invoiceProductId: 'prod-1', KOSRAE: '' }],
      },
    });

    const { didntSendReason } = await doImport(ctx, buffer, ['invoicePriceListCharging']);
    expect(didntSendReason).toEqual('validationFailed');
  });

  it('errors on an unknown charging value', async () => {
    const { InvoicePriceList } = models;
    await createMedication('prod-1');
    await InvoicePriceList.create({ ...fake(InvoicePriceList), code: 'KOSRAE' });

    const buffer = buildWorkbook({
      invoicePriceListCharging: {
        headers: ['invoiceProductId', 'KOSRAE'],
        rows: [{ invoiceProductId: 'prod-1', KOSRAE: 'sometimes' }],
      },
    });

    const { didntSendReason } = await doImport(ctx, buffer, ['invoicePriceListCharging']);
    expect(didntSendReason).toEqual('validationFailed');
  });

  it('errors when flatFee is used on a non-medication product', async () => {
    const { InvoicePriceList } = models;
    await createNonMedication('prod-1');
    await InvoicePriceList.create({ ...fake(InvoicePriceList), code: 'KOSRAE' });

    const buffer = buildWorkbook({
      invoicePriceListCharging: {
        headers: ['invoiceProductId', 'KOSRAE'],
        rows: [{ invoiceProductId: 'prod-1', KOSRAE: 'flatFee' }],
      },
    });

    const { didntSendReason, errors } = await doImport(ctx, buffer, ['invoicePriceListCharging']);
    expect(didntSendReason).toEqual('validationFailed');
    expect(errors[0].message).toContain('only supported for medications');
  });

  it('allows perUnit on a non-medication product', async () => {
    const { InvoicePriceList, InvoicePriceListItem } = models;
    await createNonMedication('prod-1');
    await InvoicePriceList.create({ ...fake(InvoicePriceList), code: 'KOSRAE' });

    const buffer = buildWorkbook({
      invoicePriceListCharging: {
        headers: ['invoiceProductId', 'KOSRAE'],
        rows: [{ invoiceProductId: 'prod-1', KOSRAE: 'perUnit' }],
      },
    });

    const { errors } = await doImport(ctx, buffer, ['invoicePriceListCharging']);
    expect(errors).toBeEmpty();
    const item = await InvoicePriceListItem.findOne({ where: { invoiceProductId: 'prod-1' } });
    expect(item.isFixedPrice).toBe(false);
  });
});
