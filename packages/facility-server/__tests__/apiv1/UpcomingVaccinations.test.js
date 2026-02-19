import config from 'config';
import { addDays, subDays } from 'date-fns';
import { QueryTypes } from 'sequelize';
import { createTestContext } from '../utilities';

import { createScheduledVaccine } from '@tamanu/database/demoData/vaccines';
import { toDateString } from '@tamanu/utils/dateTime';
import { VACCINE_STATUS, REFERENCE_TYPES, VACCINE_CATEGORIES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';

import { RefreshUpcomingVaccinations } from '../../dist/tasks/RefreshMaterializedView';
import { buildStatusExpression } from '../../dist/routes/apiv1/upcomingVaccinations';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

jest.mock('@tamanu/utils/dateTime', () => ({
  ...jest.requireActual('@tamanu/utils/dateTime'),
  getCurrentISO8601DateString: jest.fn(() => '2021-01-01 00:00:00.000Z'),
}));

const createPatient = async (models, overrides) => {
  return models.Patient.create({
    ...fake(models.Patient),
    ...overrides,
  });
};

const createNewScheduledVaccine = async (models, overrides) => {
  return models.ScheduledVaccine.create(await createScheduledVaccine(models, overrides));
};

const setupBaseDate = async (models) => {
  let facility;
  await models.ScheduledVaccine.truncate({ cascade: true });
  await models.AdministeredVaccine.truncate({ cascade: true });

  const [facilityId] = selectFacilityIds(config);
  [facility] = await models.Facility.upsert({
    id: facilityId,
    name: facilityId,
    code: facilityId,
  });

  await models.Department.create({
    ...fake(models.Department),
    facilityId: facility.id,
  });
  await models.Setting.set('upcomingVaccinations.thresholds', [
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
  await models.Setting.set('upcomingVaccinations.ageLimit', 15);
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
    await ctx.sequelize.query('REFRESH MATERIALIZED VIEW materialized_upcoming_vaccinations');
  });

  afterAll(async () => {
    jest.clearAllMocks();
    await ctx.close();
  });

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

  it('timezone should be unaffected by endpoint', async () => {
    const [timezoneBefore] = await ctx.sequelize.query('SHOW TIME ZONE');
    await app.get(`/api/upcomingVaccinations`);
    const [timezoneAfter] = await ctx.sequelize.query('SHOW TIME ZONE');
    expect(timezoneAfter).toEqual(timezoneBefore);
  });

  describe('Refresh stats', () => {
    it('returns the last updated time and cron schedule for a upcoming vaccinations materialized view', async () => {
      const task = new RefreshUpcomingVaccinations(ctx);
      await task.run();
      const res = await app.get('/api/upcomingVaccinations/updateStats');
      expect(res).toHaveStatus(200);
      expect(res.body).toEqual({
        lastRefreshed: '2021-01-01 00:00:00.000Z',
        schedule: '*/50 * * * *',
      });
    });
  });

  describe('Facility timezone status recomputation', () => {
    let statusExpr;

    beforeAll(async () => {
      const [facilityId] = selectFacilityIds(config);
      const thresholds = await ctx.settings[facilityId].get('upcomingVaccinations.thresholds');
      statusExpr = buildStatusExpression(thresholds);
    });

    const queryWithDate = (currentDate) =>
      ctx.sequelize.query(
        `
        WITH upcoming_vaccinations_with_status AS (
          SELECT
            uv.patient_id,
            uv.scheduled_vaccine_id,
            uv.due_date,
            ${statusExpr} AS status
          FROM materialized_upcoming_vaccinations uv
        ),
        upcoming_vaccinations_with_row_number AS (
          SELECT *,
          ROW_NUMBER() OVER(PARTITION BY patient_id ORDER BY due_date ASC) AS row_number
          FROM upcoming_vaccinations_with_status uv
          WHERE uv.status <> '${VACCINE_STATUS.MISSED}'
        )
        SELECT uv.*, p.display_id
        FROM upcoming_vaccinations_with_row_number uv
        JOIN patients p ON p.id = uv.patient_id
        WHERE row_number = 1
        ORDER BY uv.due_date ASC
        `,
        {
          replacements: { currentDate },
          type: QueryTypes.SELECT,
        },
      );

    it('should match original results when currentDate is today', async () => {
      const today = toDateString(new Date());
      const results = await queryWithDate(today);
      expect(results.length).toBe(6);
    });

    it('should shift statuses when currentDate moves forward', async () => {
      // Shift currentDate forward 50 days — crecord/frecord (due today-21, today-14)
      // get days_till_due of -71 and -64 respectively, both < -55 → MISSED and excluded
      const futureDate = toDateString(addDays(new Date(), 50));
      const results = await queryWithDate(futureDate);

      expect(results.length).toBe(4);
      expect(results.every(r => r.status === VACCINE_STATUS.OVERDUE)).toBe(true);
    });

    it('should produce different statuses than materialized view for shifted dates', async () => {
      const today = toDateString(new Date());
      const futureDate = toDateString(addDays(new Date(), 50));

      const todayResults = await queryWithDate(today);
      const futureResults = await queryWithDate(futureDate);

      expect(todayResults.length).not.toBe(futureResults.length);
      expect(todayResults.some(r => r.status === VACCINE_STATUS.DUE)).toBe(true);
      expect(futureResults.some(r => r.status === VACCINE_STATUS.DUE)).toBe(false);
    });

    it('should correctly filter by recomputed status', async () => {
      const futureDate = toDateString(addDays(new Date(), 50));
      const results = await queryWithDate(futureDate);

      const dueResults = results.filter(r => r.status === VACCINE_STATUS.DUE);
      const overdueResults = results.filter(r => r.status === VACCINE_STATUS.OVERDUE);

      expect(dueResults.length).toBe(0);
      expect(overdueResults.length).toBe(4);
    });
  });
});
