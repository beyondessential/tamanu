import { createTestContext } from '../utilities';
import { RefreshUpcomingVaccinations } from '../../dist/tasks/RefreshMaterializedView';
import { fake } from '@tamanu/shared/test-helpers/fake';
import { toDateString } from '@tamanu/shared/utils/dateTime';
import { QueryTypes } from 'sequelize';
import { subDays } from 'date-fns';

describe('RefreshMaterializedView', () => {
  let context;
  let models;
  let task;
  let upcomingVaccinations;
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

    await models.ScheduledVaccine.create({
      ...fake(models.ScheduledVaccine),
      // vaccineId: drug1.id,
      weeksFromBirthDue: 1,
      weeksFromLastVaccinationDue: null,
    });
    await models.ScheduledVaccine.create({
      ...fake(models.ScheduledVaccine),
      // vaccineId: drug2.id,
      weeksFromBirthDue: 2,
      weeksFromLastVaccinationDue: null,
    });
    // Up to date results from the view
    upcomingVaccinations = await context.sequelize.query('SELECT * FROM upcoming_vaccinations', {
      type: QueryTypes.SELECT,
    });
  });

  afterAll(() => context.close());

  it('should refresh materialized view', async () => {
    const originalMaterialisedResult = await context.sequelize.query(
      'SELECT * FROM materialized_upcoming_vaccinations',
      {
        type: QueryTypes.SELECT,
      },
    );
    // Check that the materialized view is empty as we haven't run the task yet
    expect(originalMaterialisedResult).toEqual([]);
    await task.run();
    const refreshedMaterializedResult = await context.sequelize.query(
      'SELECT * FROM materialized_upcoming_vaccinations',
      {
        type: QueryTypes.SELECT,
      },
    );
    // Check that the materialized view now reflects the upcoming vaccinations view
    expect(refreshedMaterializedResult).toEqual(upcomingVaccinations);
  });
});
