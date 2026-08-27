import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
import { REFERENCE_TYPES, TASK_STATUSES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { createTestContext } from '../utilities';

// The clinician dashboard worklist. Its designation filters used to be expressed as a
// belongsToMany join chain, which multiplied rows: with subQuery: false the LIMIT applies to
// joined rows, so a task carrying several designations ate several slots of the page and the
// count reported joined rows rather than tasks.
describe('GET user/tasks', () => {
  let ctx;
  let models;
  let app;
  let facilityId;
  let encounter;

  const ROWS_PER_PAGE = 10;

  const tasksUrl = (query = {}) => {
    const params = new URLSearchParams({ facilityId, rowsPerPage: ROWS_PER_PAGE, ...query });
    return `/api/user/tasks?${params}`;
  };

  const createDesignation = async () =>
    models.ReferenceData.create(fake(models.ReferenceData, { type: REFERENCE_TYPES.DESIGNATION }));

  const createTask = async (name, designations = []) => {
    const task = await models.Task.create({
      name,
      encounterId: encounter.id,
      status: TASK_STATUSES.TODO,
      dueTime: getCurrentDateTimeString(),
      requestTime: getCurrentDateTimeString(),
      requestedByUserId: app.user.id,
    });
    for (const designation of designations) {
      await models.TaskDesignation.create({ taskId: task.id, designationId: designation.id });
    }
    return task;
  };

  const designateUser = async (userId, designation) =>
    models.UserDesignation.create({ userId, designationId: designation.id });

  disableHardcodedPermissionsForSuite();

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    app = await ctx.baseApp.asNewRole([['read', 'Tasking']]);

    const patient = await models.Patient.create(await createDummyPatient(models));
    encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models, { current: true })),
      patientId: patient.id,
    });
    const location = await models.Location.findByPk(encounter.locationId);
    facilityId = location.facilityId;
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.TaskDesignation.truncate({ cascade: true, force: true });
    await models.UserDesignation.truncate({ cascade: true, force: true });
    await models.Task.truncate({ cascade: true, force: true });
  });

  it('returns every task on a page, and counts tasks, when tasks carry many designations', async () => {
    // 4 tasks x 3 designations = 12 joined rows, more than the 10-row page. Joining rather
    // than existence-checking would truncate the page and overstate the count.
    const designations = [
      await createDesignation(),
      await createDesignation(),
      await createDesignation(),
    ];
    for (const designation of designations) {
      await designateUser(app.user.id, designation);
    }
    for (const name of ['task one', 'task two', 'task three', 'task four']) {
      await createTask(name, designations);
    }

    const result = await app.get(tasksUrl());

    expect(result).toHaveSucceeded();
    expect(result.body.data).toHaveLength(4);
    expect(result.body.count).toBe(4);
    expect(result.body.data.map(task => task.name).sort()).toEqual([
      'task four',
      'task one',
      'task three',
      'task two',
    ]);
  });

  it('fills a page with tasks rather than with designation rows', async () => {
    // 5 tasks x 3 designations = 15 joined rows. A LIMIT of 10 over joined rows stops part
    // way through the fourth task, so the page would hold 4 tasks instead of all 5.
    const designations = [
      await createDesignation(),
      await createDesignation(),
      await createDesignation(),
    ];
    for (const designation of designations) {
      await designateUser(app.user.id, designation);
    }
    for (let index = 0; index < 5; index++) {
      await createTask(`task ${index}`, designations);
    }

    const result = await app.get(tasksUrl());

    expect(result).toHaveSucceeded();
    expect(result.body.data).toHaveLength(5);
    expect(result.body.count).toBe(5);
  });

  it('includes tasks that carry no designation at all', async () => {
    await createTask('undesignated task');

    const result = await app.get(tasksUrl());

    expect(result).toHaveSucceeded();
    expect(result.body.data).toHaveLength(1);
    expect(result.body.data[0].name).toBe('undesignated task');
    expect(result.body.count).toBe(1);
  });

  it('excludes tasks designated only to other users', async () => {
    const otherUser = await models.User.create(fake(models.User));
    const designation = await createDesignation();
    await designateUser(otherUser.id, designation);
    await createTask('someone elses task', [designation]);

    const result = await app.get(tasksUrl());

    expect(result).toHaveSucceeded();
    expect(result.body.data).toHaveLength(0);
    expect(result.body.count).toBe(0);
  });

  it('includes a task when the user shares just one of its designations', async () => {
    const mine = await createDesignation();
    const theirs = await createDesignation();
    const otherUser = await models.User.create(fake(models.User));
    await designateUser(app.user.id, mine);
    await designateUser(otherUser.id, theirs);
    await createTask('shared task', [mine, theirs]);

    const result = await app.get(tasksUrl());

    expect(result).toHaveSucceeded();
    expect(result.body.data).toHaveLength(1);
    expect(result.body.count).toBe(1);
  });

  it('reports the full count when the results run past one page', async () => {
    const designation = await createDesignation();
    await designateUser(app.user.id, designation);
    for (let index = 0; index < ROWS_PER_PAGE + 3; index++) {
      await createTask(`task ${index}`, [designation]);
    }

    const result = await app.get(tasksUrl());

    expect(result).toHaveSucceeded();
    expect(result.body.data).toHaveLength(ROWS_PER_PAGE);
    expect(result.body.count).toBe(ROWS_PER_PAGE + 3);
  });

  it('counts correctly on a later page that comes back short', async () => {
    const designation = await createDesignation();
    await designateUser(app.user.id, designation);
    for (let index = 0; index < ROWS_PER_PAGE + 3; index++) {
      await createTask(`task ${index}`, [designation]);
    }

    const result = await app.get(tasksUrl({ page: 1 }));

    expect(result).toHaveSucceeded();
    expect(result.body.data).toHaveLength(3);
    expect(result.body.count).toBe(ROWS_PER_PAGE + 3);
  });

  it('reports the real total when the requested page is past the end', async () => {
    // The client may still be on a page whose tasks have since been completed, so the offset
    // can land beyond the total. Deriving the total from the offset would invent one.
    const designation = await createDesignation();
    await designateUser(app.user.id, designation);
    for (let index = 0; index < 5; index++) {
      await createTask(`task ${index}`, [designation]);
    }

    const result = await app.get(tasksUrl({ page: 2 }));

    expect(result).toHaveSucceeded();
    expect(result.body.data).toHaveLength(0);
    expect(result.body.count).toBe(5);
  });

  describe('filtered by designation', () => {
    it('keeps tasks carrying the filtered designation when the user shares it', async () => {
      const filtered = await createDesignation();
      await designateUser(app.user.id, filtered);
      await createTask('filtered task', [filtered]);

      const result = await app.get(tasksUrl({ designationId: filtered.id }));

      expect(result).toHaveSucceeded();
      expect(result.body.data.map(task => task.name)).toEqual(['filtered task']);
      expect(result.body.count).toBe(1);
    });

    it('drops tasks whose filtered designation belongs to someone else', async () => {
      const filtered = await createDesignation();
      const otherUser = await models.User.create(fake(models.User));
      await designateUser(otherUser.id, filtered);
      await createTask('someone elses filtered task', [filtered]);

      const result = await app.get(tasksUrl({ designationId: filtered.id }));

      expect(result).toHaveSucceeded();
      expect(result.body.data).toHaveLength(0);
      expect(result.body.count).toBe(0);
    });

    it('still admits tasks carrying no designation matching the filter', async () => {
      // Documented, deliberately preserved behaviour of the LEFT JOIN this replaced: the
      // filter narrows which designations are considered, not which tasks are eligible, so a
      // task designated elsewhere reads as unassigned for the filter's purposes.
      const filtered = await createDesignation();
      const unrelated = await createDesignation();
      const otherUser = await models.User.create(fake(models.User));
      await designateUser(otherUser.id, unrelated);
      await createTask('undesignated task');
      await createTask('task designated elsewhere', [unrelated]);

      const result = await app.get(tasksUrl({ designationId: filtered.id }));

      expect(result).toHaveSucceeded();
      expect(result.body.data.map(task => task.name).sort()).toEqual([
        'task designated elsewhere',
        'undesignated task',
      ]);
      expect(result.body.count).toBe(2);
    });
  });

  it('rejects a request without Tasking read permission', async () => {
    const unprivilegedApp = await ctx.baseApp.asNewRole([]);

    const result = await unprivilegedApp.get(tasksUrl());

    expect(result).toBeForbidden();
  });
});
