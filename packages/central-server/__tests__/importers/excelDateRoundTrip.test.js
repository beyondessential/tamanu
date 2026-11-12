import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { read, utils, write } from 'xlsx';
import { toDateString, toDateTimeString } from '@tamanu/utils/dateTime';

import { AdministeredVaccineExporter } from '../../app/admin/exporter/modelExporters/AdministeredVaccineExporter';
import { PatientExporter } from '../../app/admin/exporter/modelExporters/PatientExporter';
import {
  administeredVaccineLoader,
  patientDataLoader,
} from '../../app/admin/referenceDataImporter/loaders';

const models = {
  Encounter: { count: async () => 1 },
  Patient: { rawAttributes: { dateOfBirth: {} } },
  PatientAdditionalData: { rawAttributes: {} },
};

const roundTripCells = (header, cells) => {
  const workbook = utils.book_new();
  utils.book_append_sheet(
    workbook,
    utils.aoa_to_sheet([[header], ...cells.map(c => [c])]),
    'Sheet',
  );
  const reread = read(write(workbook, { type: 'buffer', bookType: 'xlsx' }), { type: 'buffer' });
  return utils.sheet_to_json(reread.Sheets.Sheet).map(row => row[header]);
};

describe.each(['Pacific/Auckland', 'Pacific/Rarotonga', 'UTC'])(
  'Excel dates round-trip unchanged in %s',
  timeZone => {
    const originalTimeZone = process.env.TZ;

    beforeAll(() => {
      process.env.TZ = timeZone;
    });

    afterAll(() => {
      process.env.TZ = originalTimeZone;
    });

    it('keeps administered vaccine dates', async () => {
      const storedDates = ['2026-03-15 10:23:47', '2025-07-01 00:00:00', '2024-12-31 23:59:59'];
      const exporter = new AdministeredVaccineExporter({}, 'administeredVaccine');
      const cells = roundTripCells(
        'date',
        storedDates.map(date => exporter.formattedCell('date', date)),
      );

      const importedDates = await Promise.all(
        cells.map(async date => {
          const rows = await administeredVaccineLoader({ date }, { models });
          return toDateTimeString(
            rows.find(({ model }) => model === 'AdministeredVaccine').values.date,
          );
        }),
      );
      expect(importedDates).toEqual(storedDates);
    });

    it('keeps patient dates of birth', async () => {
      const storedDates = ['1990-05-15', '2024-12-31'];
      const exporter = new PatientExporter({}, 'patient');
      const cells = roundTripCells(
        'dateOfBirth',
        storedDates.map(date => exporter.formattedCell('dateOfBirth', date)),
      );

      const importedDates = await Promise.all(
        cells.map(async dateOfBirth => {
          const [{ values }] = await patientDataLoader(
            { dateOfBirth },
            { models, foreignKeySchemata: { Patient: [] } },
          );
          return toDateString(values.dateOfBirth);
        }),
      );
      expect(importedDates).toEqual(storedDates);
    });
  },
);
