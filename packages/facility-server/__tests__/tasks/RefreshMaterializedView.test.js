import config from 'config';
import { createTestContext } from '../utilities';
import { RefreshUpcomingVaccinations } from '../../dist/tasks/RefreshMaterializedView';
import { fake } from '@tamanu/fake-data/fake';
import { toDateString } from '@tamanu/utils/dateTime';
import { QueryTypes } from 'sequelize';
import { subDays } from 'date-fns';
import { REFERENCE_TYPES } from '@tamanu/constants';

describe('RefreshMaterializedView', () => {
  let context;
  let models;
  let task;
  let upcomingVaccinations;
  let sequelizeTimezone;
  beforeAll(async () => {
    context = await createTestContext();
    models = context.models;
    // Use upcoming vaccinations task as an example
    // Which extends RefreshMaterializedView
    task = new RefreshUpcomingVaccinations(context);
    // Prepare upcoming vaccinations
    await models.Patient.create({
      ...fake(models.Patient),
      dateOfBirth: toDateString(subDays(new Date(), 3)),
    });

    const drug1 = await models.ReferenceData.create({
      ...fake(models.ReferenceData),
      id: 'drug-1',
      type: REFERENCE_TYPES.DRUG,
    });
    const drug2 = await models.ReferenceData.create({
      ...fake(models.ReferenceData),
      id: 'drug-2',
      type: REFERENCE_TYPES.DRUG,
    });

    await models.ScheduledVaccine.create({
      ...fake(models.ScheduledVaccine),
      vaccineId: drug1.id,
      weeksFromBirthDue: 1,
      weeksFromLastVaccinationDue: null,
    });
    await models.ScheduledVaccine.create({
      ...fake(models.ScheduledVaccine),
      vaccineId: drug2.id,
      weeksFromBirthDue: 2,
      weeksFromLastVaccinationDue: null,
    });
    // Up to date results from the view, per the server timezone
    sequelizeTimezone = await context.sequelize.query('SHOW TIMEZONE;', {
      type: QueryTypes.SELECT,
      plain: true,
    });
    upcomingVaccinations = await context.sequelize.query(
      `
      SET TIMEZONE TO :serverTimezone;
      SELECT * FROM upcoming_vaccinations order by vaccine_id;
      SET TIMEZONE TO :sequelizeTimezone;
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          serverTimezone: config.primaryTimeZone,
          sequelizeTimezone: sequelizeTimezone['TimeZone'],
        },
      },
    );

    // Earlier test files in the same Jest worker (notably
    // UpcomingVaccinations.test.js) refresh this materialised view and leak
    // rows into the pre-refresh check below. Force it into an unpopulated
    // state so the precondition is deterministic.
    await context.sequelize.query(
      'REFRESH MATERIALIZED VIEW materialized_upcoming_vaccinations WITH NO DATA',
    );
  });

  afterAll(() => context.close());

  it('should refresh materialized view', async () => {
    // Sanity check: the view starts unscannable, so the task.run() below
    // is what's actually populating it.
    await expect(
      context.sequelize.query('SELECT * FROM materialized_upcoming_vaccinations', {
        type: QueryTypes.SELECT,
      }),
    ).rejects.toThrow(/has not been populated/);
    await task.run();
    const refreshedMaterializedResult = await context.sequelize.query(
      `
      SET TIMEZONE TO :serverTimezone;
      SELECT * FROM materialized_upcoming_vaccinations order by vaccine_id;
      SET TIMEZONE TO :sequelizeTimezone;
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          serverTimezone: config.primaryTimeZone,
          sequelizeTimezone: sequelizeTimezone['TimeZone'],
        },
      },
    );
    // Check that the materialized view now reflects the upcoming vaccinations view
    expect(refreshedMaterializedResult).toEqual(upcomingVaccinations);
  });
});
