import { describe, expect, it } from 'vitest';
import { read, utils, write } from 'xlsx';

import { AdministeredVaccineExporter } from '../../app/admin/exporter/modelExporters/AdministeredVaccineExporter';
import { administeredVaccineLoader } from '../../app/admin/referenceDataImporter/loaders';

const models = { Encounter: { count: async () => 1 } };

const loadedConsent = async item => {
  const rows = await administeredVaccineLoader(item, { models });
  return rows.find(({ model }) => model === 'AdministeredVaccine').values.consent;
};

const roundTripCells = cells => {
  const workbook = utils.book_new();
  utils.book_append_sheet(
    workbook,
    utils.aoa_to_sheet([['consent'], ...cells.map(c => [c])]),
    'Sheet',
  );
  const reread = read(write(workbook, { type: 'buffer', bookType: 'xlsx' }), { type: 'buffer' });
  return utils.sheet_to_json(reread.Sheets.Sheet);
};

describe('Administered vaccine consent', () => {
  it('exports false consent as n', () => {
    const exporter = new AdministeredVaccineExporter({}, 'administeredVaccine');
    expect(exporter.formattedCell('consent', true)).toBe('y');
    expect(exporter.formattedCell('consent', false)).toBe('n');
  });

  it('round-trips consent through an exported xlsx', async () => {
    const exporter = new AdministeredVaccineExporter({}, 'administeredVaccine');
    const rows = roundTripCells([true, false].map(v => exporter.formattedCell('consent', v)));
    expect(await Promise.all(rows.map(loadedConsent))).toEqual([true, false]);
  });

  it('accepts boolean cells from older exports', async () => {
    const rows = roundTripCells([true, false]);
    expect(rows.map(row => typeof row.consent)).toEqual(['boolean', 'boolean']);
    expect(await Promise.all(rows.map(loadedConsent))).toEqual([true, false]);
  });

  it.each([
    ['y', true],
    ['Yes', true],
    ['TRUE', true],
    ['n', false],
    ['', false],
    [undefined, false],
  ])('reads %j as %s', async (consent, expected) => {
    expect(await loadedConsent({ consent })).toBe(expected);
  });
});
