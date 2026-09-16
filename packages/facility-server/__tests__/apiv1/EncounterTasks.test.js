import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import config from 'config';
import { add, sub } from 'date-fns';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
import { SETTINGS_SCOPES, TASK_STATUSES } from '@tamanu/constants';
import { settingsCache } from '@tamanu/settings';
import { getCurrentDateTimeString, toDateTimeString } from '@tamanu/utils/dateTime';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

import { createTestContext } from '../utilities';

describe('GET encounter/:id/tasks', () => {
  // The route scopes settings by the logged-in facility, not by the encounter's location.
  const [facilityId] = selectFacilityIds(config);

  let ctx;
  let models;
  let app;
  let encounter;

  const tasksUrl = (query = {}) =>
    `/api/encounter/${encounter.id}/tasks?${new URLSearchParams({ rowsPerPage: 10, ...query })}`;

  const setSetting = async (key, value) => {
    await models.Setting.set(key, value, SETTINGS_SCOPES.FACILITY, facilityId);
    settingsCache.reset();
  };

  const createTaskDueAt = async (name, dueTime) =>
    models.Task.create({
      name,
      encounterId: encounter.id,
      status: TASK_STATUSES.TODO,
      dueTime: toDateTimeString(dueTime),
      requestTime: getCurrentDateTimeString(),
      requestedByUserId: app.user.id,
    });

  const createTaskDueAgo = (name, hours) => createTaskDueAt(name, sub(new Date(), { hours }));

  const listTasks = async (query) => {
    const response = await app.get(tasksUrl(query));
    expect(response).toHaveSucceeded();
    return { names: response.body.data.map((task) => task.name), count: response.body.count };
  };

  disableHardcodedPermissionsForSuite();

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    app = await ctx.baseApp.asNewRole([
      ['list', 'Tasking'],
      ['read', 'Encounter'],
    ]);

    const patient = await models.Patient.create(await createDummyPatient(models));
    encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models, { current: true })),
      patientId: patient.id,
    });
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.Task.truncate({ cascade: true, force: true });
  });

  afterEach(async () => {
    await setSetting('tasking.encounterOverdueTasksTimeFrame', null);
    await setSetting('tasking.dashboardOverdueTasksTimeFrame', null);
  });

  it('includes arbitrarily old tasks when no floor is set', async () => {
    await createTaskDueAgo('ancient', 24 * 90);

    const { names, count } = await listTasks();

    expect(names).toEqual(['ancient']);
    expect(count).toBe(1);
  });

  it('drops tasks overdue by longer than the floor and keeps newer ones', async () => {
    await createTaskDueAgo('too-old', 10);
    await createTaskDueAgo('within-window', 2);
    await setSetting('tasking.encounterOverdueTasksTimeFrame', 8);

    const { names, count } = await listTasks();

    expect(names).toEqual(['within-window']);
    expect(count).toBe(1);
  });

  it('still applies the upcoming ceiling when a floor is set', async () => {
    // upcomingTasksTimeFrame defaults to 8 hours, so a task due in 24 is above the ceiling
    // whether or not a floor is in play.
    await createTaskDueAt('too-far-ahead', add(new Date(), { hours: 24 }));
    await createTaskDueAgo('within-window', 2);
    await setSetting('tasking.encounterOverdueTasksTimeFrame', 8);

    const { names, count } = await listTasks();

    expect(names).toEqual(['within-window']);
    expect(count).toBe(1);
  });

  it('is unaffected by the dashboard floor', async () => {
    await createTaskDueAgo('old', 10);
    await setSetting('tasking.dashboardOverdueTasksTimeFrame', 8);

    const { names, count } = await listTasks();

    expect(names).toEqual(['old']);
    expect(count).toBe(1);
  });
});
