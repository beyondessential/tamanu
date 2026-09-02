import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { utils } from 'xlsx';

import { GENERAL_IMPORTABLE_DATA_TYPES, OTHER_REFERENCE_TYPES } from '@tamanu/constants/importable';

import { importerTransaction } from '../../app/admin/importer/importerEndpoint';
import { referenceDataImporter } from '../../app/admin/referenceDataImporter';
import { exporter } from '../../app/admin/exporter';
import { writeExcelFile } from '../../app/utils/excelUtils';
import { createTestContext } from '../utilities';

vi.mock('../../app/utils/excelUtils', async () => {
  const originalModule = await vi.importActual('../../app/utils/excelUtils');
  return {
    ...originalModule,
    writeExcelFile: vi.fn((_sheets, filename) => filename),
  };
});

vi.setConfig({ testTimeout: 50000 });

// SensitiveNetwork.id is a UUID column, unlike the string primary keys every other reference data
// sheet uses, so fixture ids have to be well-formed UUIDs rather than readable slugs.
const NETWORK_A = '11111111-1111-0000-0000-000000000001';

// The import column has to match what the export writes. If it does not, exporting a deployment's
// reference data and importing it back drops every facility's membership — and drops it silently,
// because a missing column reads as "no change" and never trips the guard.
// spec: specs/sync/sensitive-networks.md
describe('Sensitive network export round trip', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    await models.Facility.destroy({ where: {}, force: true });
    await models.SensitiveNetwork.destroy({ where: {}, force: true });
  });

  const exportSheets = async dataTypes => {
    await exporter(ctx.store, dataTypes);
    const [sheets] = writeExcelFile.mock.calls.at(-1);
    return sheets;
  };

  const sheetNamed = (sheets, name) => sheets.find(sheet => sheet.name === name);

  it('exports networks to their own sheet', async () => {
    await models.SensitiveNetwork.create({ id: NETWORK_A, code: 'NETA', name: 'Network A' });

    const sheets = await exportSheets([OTHER_REFERENCE_TYPES.SENSITIVE_NETWORK]);
    const networkSheet = sheetNamed(sheets, 'Sensitive Network');

    expect(networkSheet).toBeDefined();
    const [headers, ...rows] = networkSheet.data;
    expect(headers).toEqual(expect.arrayContaining(['id', 'code', 'name']));
    expect(rows).toHaveLength(1);
    expect(rows[0][headers.indexOf('code')]).toBe('NETA');
  });

  it('exports the facility network column under the name the importer reads', async () => {
    await models.SensitiveNetwork.create({ id: NETWORK_A, code: 'NETA', name: 'Network A' });
    await models.Facility.create({
      id: 'fac-a',
      code: 'FACA',
      name: 'Facility A',
      sensitiveNetworkId: NETWORK_A,
    });

    const sheets = await exportSheets([OTHER_REFERENCE_TYPES.FACILITY]);
    const [headers, ...rows] = sheetNamed(sheets, 'Facility').data;

    expect(headers).toContain('sensitiveNetworkId');
    expect(rows[0][headers.indexOf('sensitiveNetworkId')]).toBe(NETWORK_A);
  });

  it('preserves membership when exported reference data is imported back unchanged', async () => {
    await models.SensitiveNetwork.create({ id: NETWORK_A, code: 'NETA', name: 'Network A' });
    await models.Facility.create({
      id: 'fac-a',
      code: 'FACA',
      name: 'Facility A',
      sensitiveNetworkId: NETWORK_A,
    });
    await models.Facility.create({ id: 'fac-b', code: 'FACB', name: 'Facility B' });

    const sheets = await exportSheets([
      OTHER_REFERENCE_TYPES.SENSITIVE_NETWORK,
      OTHER_REFERENCE_TYPES.FACILITY,
    ]);

    const workbook = utils.book_new();
    for (const { name, data } of sheets) {
      utils.book_append_sheet(workbook, utils.aoa_to_sheet(data), name);
    }

    const { errors } = await importerTransaction({
      importer: referenceDataImporter,
      workbook,
      models,
      includedDataTypes: GENERAL_IMPORTABLE_DATA_TYPES,
      checkPermission: () => true,
    });

    expect(errors).toEqual([]);
    expect((await models.Facility.findByPk('fac-a')).sensitiveNetworkId).toBe(NETWORK_A);
    expect((await models.Facility.findByPk('fac-b')).sensitiveNetworkId).toBeNull();
  });
});
