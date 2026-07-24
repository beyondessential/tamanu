import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { addDays } from 'date-fns';
import { TASK_STATUSES } from '@tamanu/constants';

import { createTestContext } from '../utilities';
import { GenerateRepeatingTasks } from '../../app/tasks/GenerateRepeatingTasks';

// Mock config for the task
jest.mock('config', () => ({
  ...jest.requireActual('config'),
  schedules: {
    ...jest.requireActual('config').schedules,
    generateRepeatingTasks: {
      schedule: '0 1 * * *',
      batchSize: 2,
      batchSleepAsyncDurationInMilliseconds: 10,
      enabled: true,
      jitterTime: 0,
    },
  },
}));

// Mock sleepAsync to speed up tests
jest.mock('@tamanu/utils/sleepAsync', () => ({
  sleepAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('GenerateRepeatingTasks', () => {
  let ctx;
  let models;
  let task;
  let examiner;
  let patient;
  let facility;
  let department;
  let location;
  let encounter;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    examiner = await models.User.create(fakeUser());
    patient = await models.Patient.create(fake(models.Patient));
    facility = await models.Facility.create(fake(models.Facility));
    department = await models.Department.create(
      fake(models.Department, { facilityId: facility.id }),
    );
    location = await models.Location.create(fake(models.Location, { facilityId: facility.id }));
    encounter = await models.Encounter.create(
      fake(models.Encounter, {
        patientId: patient.id,
        examinerId: examiner.id,
        departmentId: department.id,
        locationId: location.id,
        endDate: null,
      }),
    );
  });

  beforeEach(async () => {
    // Clear any existing data
    await models.Task.destroy({ where: {}, force: true });

    // Reset mocks
    jest.clearAllMocks();
    jest.spyOn(models.Task, 'generateRepeatingTasks').mockImplementation(async () => {});

    task = new GenerateRepeatingTasks(ctx);
  });

  afterAll(async () => {
    await ctx.close();
  });

  const createTask = async (overrides = {}) => {
    return await models.Task.create(
      fake(models.Task, {
        encounterId: encounter.id,
        requestedByUserId: examiner.id,
        status: TASK_STATUSES.TODO,
        dueTime: toDateTimeString(addDays(new Date(), 1)),
        endTime: null,
        parentTaskId: null,
        frequencyValue: 1,
        frequencyUnit: 'day',
        ...overrides,
      }),
    );
  };

  const getProcessedTaskIds = () => {
    return models.Task.generateRepeatingTasks.mock.calls.flatMap(([tasks]) =>
      tasks.map(processedTask => processedTask.id),
    );
  };

  describe('batching logic', () => {
    it('should generate child tasks for every repeating parent task across batches', async () => {
      // Create 5 repeating parent tasks (batch size is 2, so should create 3 batches)
      const parentTasks = [];
      for (let i = 0; i < 5; i++) {
        parentTasks.push(await createTask());
      }

      await task.run();

      expect(models.Task.generateRepeatingTasks).toHaveBeenCalledTimes(3);

      const processedTaskIds = getProcessedTaskIds();
      expect(processedTaskIds).toHaveLength(5);
      parentTasks.forEach(parentTask => {
        expect(processedTaskIds).toContain(parentTask.id);
      });
    });

    it('should process every parent even when tasks leave the filter mid-run', async () => {
      // Create 6 repeating parent tasks (batch size is 2, so 3 batches)
      const parentTasks = [];
      for (let i = 0; i < 6; i++) {
        parentTasks.push(await createTask());
      }

      // Simulate an incoming sync setting endTime on already-processed parents
      // between pages — with keyset pagination no unprocessed parent is skipped
      models.Task.generateRepeatingTasks.mockImplementation(async tasks => {
        await models.Task.update(
          { endTime: toDateTimeString(new Date()) },
          { where: { id: tasks.map(({ id }) => id) } },
        );
      });

      await task.run();

      const processedTaskIds = getProcessedTaskIds();
      expect(processedTaskIds).toHaveLength(6);
      parentTasks.forEach(parentTask => {
        expect(processedTaskIds).toContain(parentTask.id);
      });
    });

    it('should only count repeating parent tasks when batching', async () => {
      // 2 repeating parent tasks fit in a single batch of 2
      const repeatingTasks = [await createTask(), await createTask()];
      // Non-repeating and child tasks should not inflate the batch count
      await createTask({ frequencyValue: null, frequencyUnit: null });
      await createTask({ frequencyValue: null, frequencyUnit: null });
      await createTask({ parentTaskId: repeatingTasks[0].id });

      await task.run();

      expect(models.Task.generateRepeatingTasks).toHaveBeenCalledTimes(1);

      const processedTaskIds = getProcessedTaskIds();
      expect(processedTaskIds.sort()).toEqual(repeatingTasks.map(({ id }) => id).sort());
    });
  });
});
