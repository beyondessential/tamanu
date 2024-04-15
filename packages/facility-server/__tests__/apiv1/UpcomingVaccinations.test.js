import { createTestContext } from '../utilities';
import { createDummyEncounter } from '@tamanu/shared/demoData/patients';
import {
  createAdministeredVaccine,
  createScheduledVaccine,
} from '@tamanu/shared/demoData/vaccines';
import { toDateString } from '@tamanu/shared/utils/dateTime';
import { fake } from '@tamanu/shared/test-helpers/fake';
import config from 'config';
import { VACCINE_STATUS, REFERENCE_TYPES, VACCINE_CATEGORIES } from '@tamanu/constants';
import { subDays } from 'date-fns';

let facility = null;
let drug = null;

const recordAdministeredVaccine = async (models, patientDOB, overrides) => {
  const patient = await models.Patient.create({
    ...fake(models.Patient),
    dateOfBirth: patientDOB,
  });
  const encounter = await models.Encounter.create(
    await createDummyEncounter(models, { patientId: patient.id }),
  );
  return models.AdministeredVaccine.create(
    await createAdministeredVaccine(models, {
      encounterId: encounter.id,
      ...overrides,
    }),
  );
};

const createNewScheduledVaccine = async (models, overrides) => {
  return models.ScheduledVaccine.create(
    await createScheduledVaccine(models, {
      vaccineId: drug.id,
      ...overrides,
    }),
  );
};

const setupBaseDate = async models => {
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
      status: 'SCHEDULED',
    },
    {
      threshold: 7,
      status: 'UPCOMING',
    },
    {
      threshold: -7,
      status: 'DUE',
    },
    {
      threshold: -55,
      status: 'OVERDUE',
    },
    {
      threshold: '-Infinity',
      status: 'MISSED',
    },
  ]);
  drug = await models.ReferenceData.create(
    fake(models.ReferenceData, { type: REFERENCE_TYPES.DRUG }),
  );
  await models.Setting.set('routineVaccine.ageLimit', 15);
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

const ADMINISTERED_VACCINES = [
  {
    scheduledVaccineId: 'vaccine1',
    patientDOB: toDateString(subDays(new Date(), 1)),
  },
  {
    scheduledVaccineId: 'vaccine1',
    patientDOB: toDateString(subDays(new Date(), 14)),
  },
  {
    scheduledVaccineId: 'vaccine1',
    patientDOB: toDateString(subDays(new Date(), 28)),
  },
  {
    scheduledVaccineId: 'vaccine2',
    patientDOB: toDateString(subDays(new Date(), 1)),
  },
  {
    scheduledVaccineId: 'vaccine2',
    patientDOB: toDateString(subDays(new Date(), 14)),
  },
  {
    scheduledVaccineId: 'vaccine2',
    patientDOB: toDateString(subDays(new Date(), 28)),
  },
];

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

    try {
      // set up base data
      await setupBaseDate(models);

      // set up reference data
      for (const sv of SCHEDULED_VACCINES) {
        await createNewScheduledVaccine(models, {
          id: sv.id,
          category: VACCINE_CATEGORIES.ROUTINE,
          label: sv.label,
          weeksFromBirthDue: sv.weeksFromBirthDue,
        });
      }

      // set up clinical data
      for (const av of ADMINISTERED_VACCINES) {
        await recordAdministeredVaccine(models, av.patientDOB, {
          scheduledVaccineId: av.scheduledVaccineId,
          status: VACCINE_STATUS.GIVEN,
        });
      }
    } catch (error) {
      console.log('ERROR', error);
    }
  });

  afterAll(() => ctx.close());

  it('should return all upcoming vaccinations of patient', async () => {
    const result = await app.get(`/api/upcomingVaccinations`);

    console.log('RESULT', result.body.data);
    expect(result).toHaveSucceeded();
  });

  it.todo('should return the correct number of upcoming vaccinations records');
  it.todo('should exclude missed vaccination records');
  it.todo('should filter');
  it.todo('should sort');
});
