import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { readFile, utils } from 'xlsx';

import { writeExcelFile } from '../../app/utils/excelUtils';
import { administeredVaccineLoader } from '../../app/admin/referenceDataImporter/loaders';

const models = { Encounter: { count: async () => 1 } };

const loadedVaccine = async (item, pushError = vi.fn()) => {
  const rows = await administeredVaccineLoader(item, { models, pushError });
  return rows.find(({ model }) => model === 'AdministeredVaccine').values;
};

describe('Administered vaccine circumstances', () => {
  let directory;

  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'administered-vaccine-'));
  });

  afterAll(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('round-trips circumstances through an exported xlsx', async () => {
    const fileName = writeExcelFile(
      [
        {
          name: 'Administered Vaccine',
          data: [
            ['id', 'circumstanceIds'],
            ['vaccine-1', []],
            ['vaccine-2', ['circumstance-a', 'circumstance-b']],
            ['vaccine-3', null],
          ],
        },
      ],
      join(directory, 'export.xlsx'),
    );
    const rows = utils.sheet_to_json(readFile(fileName).Sheets['Administered Vaccine']);
    expect(rows.map(row => row.circumstanceIds)).toEqual([
      '[]',
      '["circumstance-a","circumstance-b"]',
      undefined,
    ]);

    const pushError = vi.fn();
    const loaded = await Promise.all(rows.map(row => loadedVaccine(row, pushError)));
    expect(loaded.map(values => values.circumstanceIds)).toEqual([
      [],
      ['circumstance-a', 'circumstance-b'],
      undefined,
    ]);
    expect(pushError).not.toHaveBeenCalled();
  });

  it('leaves circumstances untouched when the column is absent', async () => {
    expect(await loadedVaccine({})).not.toHaveProperty('circumstanceIds');
  });

  it.each([
    ['', []],
    [null, []],
    ['circumstance-a', ['circumstance-a']],
    [' circumstance-a , circumstance-b ,', ['circumstance-a', 'circumstance-b']],
    ['[ "circumstance-a" ]', ['circumstance-a']],
  ])('reads %j as %j', async (circumstanceIds, expected) => {
    const pushError = vi.fn();
    expect((await loadedVaccine({ circumstanceIds }, pushError)).circumstanceIds).toEqual(expected);
    expect(pushError).not.toHaveBeenCalled();
  });

  it.each(['[not json', '[{"a":1}'])(
    'rejects the row for an unreadable list %j',
    async circumstanceIds => {
      await expect(loadedVaccine({ circumstanceIds })).rejects.toThrow('circumstanceIds');
    },
  );
});
