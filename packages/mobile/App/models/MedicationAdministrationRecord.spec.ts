import { Database } from '~/infra/db';
import { ADMINISTRATION_FREQUENCIES } from '~/constants/medications';
import { getCurrentDateTimeString } from '~/ui/helpers/date';

// Local ISO 9075 datetime, e.g. "2026-07-10 20:00:00" (space separator, no timezone suffix).
const ISO_9075_DATETIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

describe('MedicationAdministrationRecord', () => {
  beforeAll(async () => {
    await Database.connect();
  });

  beforeEach(async () => {
    await Database.models.MedicationAdministrationRecord.clear();
    await Database.models.Prescription.clear();
  });

  describe('generateMedicationAdministrationRecords', () => {
    it('stores auto-generated dueAt as a local ISO 9075 datetime string', async () => {
      const prescription = await Database.models.Prescription.createAndSaveOne({
        date: getCurrentDateTimeString(),
        startDate: getCurrentDateTimeString(),
        frequency: ADMINISTRATION_FREQUENCIES.DAILY,
        idealTimes: '08:00,20:00',
        dosingUnit: 'mg',
      });

      await Database.models.MedicationAdministrationRecord.generateMedicationAdministrationRecords(
        prescription,
      );

      const records = await Database.models.MedicationAdministrationRecord.find({
        where: { prescriptionId: prescription.id },
      });

      expect(records.length).toBeGreaterThan(0);
      for (const record of records) {
        expect(record.dueAt).toMatch(ISO_9075_DATETIME);
      }
    });
  });
});
