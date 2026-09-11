import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
import { TASK_STATUSES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { createTestContext } from '../utilities';

describe('DELETE tasks', () => {
  let ctx;
  let models;
  let app;
  let encounter;

  const createTodoTask = name =>
    models.Task.create({
      name,
      encounterId: encounter.id,
      status: TASK_STATUSES.TODO,
      dueTime: getCurrentDateTimeString(),
      requestTime: getCurrentDateTimeString(),
      requestedByUserId: app.user.id,
    });

  disableHardcodedPermissionsForSuite();

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    app = await ctx.baseApp.asNewRole([['delete', 'Tasking']]);

    const patient = await models.Patient.create(await createDummyPatient(models));
    encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models, { current: true })),
      patientId: patient.id,
    });
  });

  afterAll(() => ctx.close());

  it('deletes every task listed in the request body', async () => {
    const tasks = await Promise.all(
      Array.from({ length: 25 }, (_, index) => createTodoTask(`Task ${index}`)),
    );
    const taskIds = tasks.map(task => task.id);

    const response = await app.delete('/api/tasks').send({
      taskIds,
      deletedByUserId: app.user.id,
      deletedTime: getCurrentDateTimeString(),
    });
    expect(response).toHaveSucceeded();

    const remaining = await models.Task.findAll({ where: { id: taskIds } });
    expect(remaining).toHaveLength(0);
  });
});
