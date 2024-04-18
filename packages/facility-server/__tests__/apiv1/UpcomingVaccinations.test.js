import { createTestContext } from '../utilities';
import { createScheduledVaccine } from '@tamanu/shared/demoData/vaccines';
import { toDateString } from '@tamanu/shared/utils/dateTime';
import { fake } from '@tamanu/shared/test-helpers/fake';
import config from 'config';
import { VACCINE_STATUS, REFERENCE_TYPES, VACCINE_CATEGORIES } from '@tamanu/constants';
import { subDays } from 'date-fns';

const createPatient = async (models, overrides) => {
  return models.Patient.create({
    ...fake(models.Patient),
    ...overrides,
  });
};

const createNewScheduledVaccine = async (models, overrides) => {
  return models.ScheduledVaccine.create(await createScheduledVaccine(models, overrides));
};

const setupBaseDate = async models => {
  let facility;
  await models.ScheduledVaccine.truncate({ cascade: true });
  await models.AdministeredVaccine.truncate({ cascade: true });

  [facility] = await models.Facility.upsert({
    id: config.serverFacilityId,
    name: config.serverFacilityId,
    code: config.serverFacilityId,
  });

  await models.Department.create({
    ...fake(models.Department),
    facilityId: facility.id,
  });
  await models.Setting.set('routineVaccine.thresholds', [
    {
      threshold: 28,
      status: VACCINE_STATUS.SCHEDULED,
    },
    {
      threshold: 7,
      status: VACCINE_STATUS.UPCOMING,
    },
    {
      threshold: -7,
      status: VACCINE_STATUS.DUE,
    },
    {
      threshold: -55,
      status: VACCINE_STATUS.OVERDUE,
    },
    {
      threshold: '-Infinity',
      status: VACCINE_STATUS.MISSED,
    },
  ]);
  const drug = await models.ReferenceData.create(
    fake(models.ReferenceData, { type: REFERENCE_TYPES.DRUG }),
  );
  await models.Setting.set('routineVaccine.ageLimit', 15);
  return { facility, drug };
};

const SCHEDULED_VACCINES = [
  {
    id: 'vaccine1',
    label: 'First vaccine',
    weeksFromBirthDue: 1,
  },
  {
    id: 'vaccine2',
    label: 'Second vaccine',
    weeksFromBirthDue: 2,
  },
];

const PATIENTS = [
  {
    displayId: 'arecord',
    dateOfBirth: toDateString(subDays(new Date(), 1)),
  },
  {
    displayId: 'brecord',
    dateOfBirth: toDateString(subDays(new Date(), 3)),
  },
  {
    displayId: 'crecord',
    dateOfBirth: toDateString(subDays(new Date(), 28)),
  },
  {
    displayId: 'dhrecord',
    dateOfBirth: toDateString(subDays(new Date(), 1)),
  },
  {
    displayId: 'erecord',
    dateOfBirth: toDateString(subDays(new Date(), 3)),
  },
  {
    displayId: 'frecord',
    dateOfBirth: toDateString(subDays(new Date(), 28)),
  },
];

// Note that these tests are to cover the upcoming vaccinations endpoint. The vaccine logic is tested elsewhere
describe('Upcoming vaccinations', () => {
  let ctx;
  let models = null;
  let app = null;
  let baseApp = null;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');

    // set up base data
    const { drug } = await setupBaseDate(models);

    // set up reference data
    for (const vax of SCHEDULED_VACCINES) {
      await createNewScheduledVaccine(models, {
        ...vax,
        category: VACCINE_CATEGORIES.ROUTINE,
        vaccineId: drug.id,
      });
    }

    // set up clinical data
    for (const patientData of PATIENTS) {
      await createPatient(models, patientData);
    }
  });

  afterAll(() => ctx.close());

  it('should successfully return upcoming patient vaccinations', async () => {
    const result = await app.get(`/api/upcomingVaccinations`);
    expect(result).toHaveSucceeded();
    expect(result.body.data.length).toBe(6);
  });

  it('should exclude missed vaccination records', async () => {
    await createPatient(models, {
      dateOfBirth: toDateString(subDays(new Date(), 500)),
    });
    const result = await app.get(`/api/upcomingVaccinations`);
    expect(result.body.data.length).toBe(6);
  });

  it('should filter', async () => {
    const overDueResult = await app.get(
      `/api/upcomingVaccinations?status=${VACCINE_STATUS.OVERDUE}`,
    );
    expect(overDueResult.body.data.length).toBe(2);
    const dueResult = await app.get(`/api/upcomingVaccinations?status=${VACCINE_STATUS.DUE}`);
    expect(dueResult.body.data.length).toBe(4);
  });

  it('should sort by due date by default', async () => {
    const result = await app.get(`/api/upcomingVaccinations`);
    expect(
      result.body.data.every((vax, i) => !i || vax.dueDate >= result.body.data[i - 1].dueDate),
    ).toBeTruthy();
  });

  it('should sort by params', async () => {
    const ascResult = await app.get(`/api/upcomingVaccinations?orderBy=displayId&order=asc`);
    const ascData = ascResult.body.data;
    expect(ascData[0].displayId).toBe('arecord');
    const descResult = await app.get(`/api/upcomingVaccinations?orderBy=displayId&order=desc`);
    const descData = descResult.body.data;
    expect(descData[0].displayId).toBe('frecord');
  });
});
