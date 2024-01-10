import moment from 'moment';
import {
  createDummyEncounter,
  createDummyPatient,
  randomReferenceId,
} from '@tamanu/shared/demoData/patients';
import { createAdministeredVaccine, createScheduledVaccine } from '@tamanu/shared/demoData/vaccines';
import { createTestContext } from '../../utilities';
import { parseISO } from 'date-fns';

describe('Vaccine list report', () => {
  let baseApp = null;
  let app = null;
  let expectedPatient = null;
  let scheduledVaccine1 = null;
  let scheduledVaccine2 = null;
  let village;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    const { models } = ctx;
    baseApp = ctx.baseApp;
    village = await randomReferenceId(models, 'village');

    expectedPatient = await models.Patient.create(
      await createDummyPatient(models, { villageId: village }),
    );
    app = await baseApp.asRole('practitioner');

    const encounter1 = await models.Encounter.create(
      await createDummyEncounter(models, { patientId: expectedPatient.id, current: true }),
    );

    const encounter2 = await models.Encounter.create(
      await createDummyEncounter(models, { patientId: expectedPatient.id, current: true }),
    );

    scheduledVaccine1 = await models.ScheduledVaccine.create(
      await createScheduledVaccine(models, {
        category: 'Campaign',
        label: 'COVID-19',
        schedule: 'Dose 1',
      }),
    );
    scheduledVaccine2 = await models.ScheduledVaccine.create(
      await createScheduledVaccine(models, {
        category: 'Routine',
        label: 'BCG',
        schedule: 'Dose 1',
      }),
    );

    await models.AdministeredVaccine.create(
      await createAdministeredVaccine(models, {
        scheduledVaccineId: scheduledVaccine1.id,
        encounterId: encounter1.id,
        date: parseISO('2021-03-10'),
      }),
    );

    await models.AdministeredVaccine.create(
      await createAdministeredVaccine(models, {
        scheduledVaccineId: scheduledVaccine2.id,
        encounterId: encounter2.id,
        date: parseISO('2021-03-15'),
      }),
    );
  });
  afterAll(() => ctx.close());

  describe('permission check', () => {
    it('should reject creating an vaccine line list report with insufficient permissions', async () => {
      const noPermsApp = await baseApp.asRole('base');
      const result = await noPermsApp.post(`/v1/reports/vaccine-list`, {});
      expect(result).toBeForbidden();
    });
  });

  describe('returns data based on parameters', () => {
    it('should return data for patients of the right village', async () => {
      const result = await app.post('/v1/reports/vaccine-list').send({
        parameters: { village, fromDate: '2021-03-15' },
      });

      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(2);
      expect(result.body[1][0]).toBe(`${expectedPatient.firstName} ${expectedPatient.lastName}`);
      expect(result.body[1][1]).toBe(expectedPatient.displayId);
      expect(result.body[1][2]).toBe(moment(expectedPatient.dateOfBirth).format('DD-MM-YYYY'));
      expect(result.body[1][3]).toBe(expectedPatient.sex);
      expect(result.body[1][5]).toBe(scheduledVaccine2.label);
      expect(result.body[1][6]).toBe('Yes');
      expect(result.body[1][7]).toBe(scheduledVaccine2.schedule);
      expect(result.body[1][8]).toBe('15-03-2021');
    });

    it('should return no data for patients with random village', async () => {
      const result = await app.post('/v1/reports/vaccine-list').send({
        parameters: { village: 'RANDOM_VILLAGE', fromDate: '2021-03-15' },
      });

      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(1);
    });

    it('should return data for patients with the right vaccine category and vaccine type', async () => {
      const result = await app.post('/v1/reports/vaccine-list').send({
        parameters: { category: 'Campaign', vaccine: 'COVID-19', fromDate: '2021-03-01' },
      });

      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(2);
      expect(result.body[1][0]).toBe(`${expectedPatient.firstName} ${expectedPatient.lastName}`);
      expect(result.body[1][1]).toBe(expectedPatient.displayId);
      expect(result.body[1][2]).toBe(moment(expectedPatient.dateOfBirth).format('DD-MM-YYYY'));
      expect(result.body[1][3]).toBe(expectedPatient.sex);
      expect(result.body[1][5]).toBe(scheduledVaccine1.label);
      expect(result.body[1][6]).toBe('Yes');
      expect(result.body[1][7]).toBe(scheduledVaccine1.schedule);
      expect(result.body[1][8]).toBe('10-03-2021');
    });

    it('should return no data for patients with random vaccine type', async () => {
      const result = await app.post('/v1/reports/vaccine-list').send({
        parameters: { category: 'Campaign', vaccine: 'RANDOM_VACCINE', fromDate: '2021-03-01' },
      });

      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(1);
    });
  });
});
