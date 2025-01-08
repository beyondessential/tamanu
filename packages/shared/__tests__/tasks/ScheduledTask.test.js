import { addMilliseconds, addHours, addDays, addMonths, isWithinInterval } from 'date-fns';

import { ScheduledTask } from '../../src/tasks/ScheduledTask';
import { log } from '../../src/services/logging/log';

class TestScheduledTask extends ScheduledTask {
  getName() {
    return 'TestScheduledTask';
  }

  /**
   * @param {() => void} runner
   * @param {{ schedule?: string, jitterTime?: string, enabled?: boolean}} config
   */
  constructor(runner = () => {}, config = {}) {
    const { schedule, jitterTime, enabled } = config;
    super(schedule, log, jitterTime, enabled);
    this.runner = runner;
  }

  async run() {
    return this.runner();
  }
}

class TestQueuedScheduledTask extends TestScheduledTask {
  /**
   * @param {() => void} runner
   * @param {{ schedule?: string, jitterTime?: string, enabled?: boolean}} config
   */
  constructor(runner = () => {}, config = {}) {
    super(runner, config);
    this.queue = [];
  }

  async countQueue() {
    return this.queue.length;
  }
}

const systemTime = new Date('2020-01-01T00:00:00.000Z');
jest.useFakeTimers().setSystemTime(systemTime);

jest.mock('@tamanu/utils/sleepAsync', () => {
  return {
    __esModule: true,
    sleepAsync: (ms) => {
      // Update the Date.now() whenever we sleep to mock the jitter behaviour
      jest.useFakeTimers().setSystemTime(addMilliseconds(systemTime, ms));
    },
  };
});
jest.mock('shortid', () => () => 'test-task-id');

describe('ScheduledTask', () => {
  beforeAll(() => {});

  afterEach(() => {
    jest.useFakeTimers().setSystemTime(systemTime);
  });

  it('Should run a task on a schedule', () => {
    const onEveryHour = new TestScheduledTask(() => {}, {
      schedule: { rule: '0 * * * *', tz: 'UTC' },
    });
    const onMidnightEveryDay = new TestScheduledTask(() => {}, {
      schedule: { rule: '0 0 * * *', tz: 'UTC' },
    });
    const onFirstDayEveryMonth = new TestScheduledTask(() => {}, {
      schedule: { rule: '0 0 1 * *', tz: 'UTC' },
    });
    const tasks = [onEveryHour, onMidnightEveryDay, onFirstDayEveryMonth];

    tasks.forEach((task) => task.beginPolling());

    expect(onEveryHour.job.nextInvocation().toISOString()).toEqual(
      addHours(systemTime, 1).toISOString(),
    );
    expect(onMidnightEveryDay.job.nextInvocation().toISOString()).toEqual(
      addDays(systemTime, 1).toISOString(),
    );
    expect(onFirstDayEveryMonth.job.nextInvocation().toISOString()).toEqual(
      addMonths(systemTime, 1).toISOString(),
    );

    tasks.forEach((task) => task.cancelPolling());
    tasks.forEach((task) => expect(task.job).toBeNull());
  });

  it('Can add some jitter between runs', async () => {
    const jitterTime = '500';

    let taskRanAt;
    const task = new TestScheduledTask(
      () => {
        taskRanAt = new Date();
      },
      {
        schedule: { rule: '0 * * * *', tz: 'UTC' },
        jitterTime,
      },
    );

    task.beginPolling();
    await task.job.invoke(); // Force the invocation

    const min = systemTime;
    const max = addMilliseconds(systemTime, jitterTime);
    expect(
      isWithinInterval(taskRanAt, {
        start: min,
        end: max,
      }),
    ).toBe(true);

    task.cancelPolling();
  });

  it('Can be disabled', async () => {
    let hasRun = false;
    const task = new TestScheduledTask(
      () => {
        hasRun = true;
      },
      {
        schedule: { rule: '0 * * * *', tz: 'UTC' },
        enabled: false,
      },
    );

    task.beginPolling();
    await task.runImmediately();

    expect(task.job).toBeNull();
    expect(hasRun).toBe(false);

    task.cancelPolling();
  });

  it('Will not start another run until a previous run has completed', async () => {
    let runsStarted = 0;
    let runsCompleted = 0;

    const runStartedResolves = [];
    const runStartedPromises = [];
    const completeRunResolves = [];
    runStartedPromises.push(
      new Promise((resolve) => {
        runStartedResolves.push(resolve);
      }),
    );
    runStartedPromises.push(
      new Promise((resolve) => {
        runStartedResolves.push(resolve);
      }),
    );

    const task = new TestScheduledTask(async () => {
      const runStartedResolve = runStartedResolves[runsStarted];
      runsStarted += 1;
      runStartedResolve();
      return new Promise((resolve) => {
        completeRunResolves.push(resolve);
      }).then(() => {
        runsCompleted += 1;
      });
    });

    const firstTaskPromise = task.runImmediately(); // First run, won't complete until we call it's resolve
    await runStartedPromises[0]; // Wait for first run to start
    expect(task.isRunning).toBe(true);
    expect(runsStarted).toBe(1);
    expect(runsCompleted).toBe(0);

    await task.runImmediately(); // Second run, it will skip since we haven't completed the first run
    expect(runsStarted).toBe(1);
    expect(runsCompleted).toBe(0);

    completeRunResolves[0](); // Complete the first task
    await firstTaskPromise; // Wait for the first task to finish
    expect(runsStarted).toBe(1);
    expect(runsCompleted).toBe(1);
  });

  describe('subtasks', () => {
    it('Can run a number of subtasks', async () => {
      let hasParentTaskRun = false;
      let hasSubTask1Run = false;
      let hasSubTask2Run = false;

      const parentTask = new TestScheduledTask(() => {
        hasParentTaskRun = true;
      });

      const subTask1 = new TestScheduledTask(() => {
        hasSubTask1Run = true;
      });
      const subTask2 = new TestScheduledTask(() => {
        hasSubTask2Run = true;
      });
      parentTask.subtasks = [subTask1, subTask2];

      await parentTask.runImmediately();

      expect(hasParentTaskRun).toBe(true);
      expect(hasSubTask1Run).toBe(true);
      expect(hasSubTask2Run).toBe(true);
    });

    it('If a subtask fails, neither the remaining subtasks nor the parent will run', async () => {
      let hasParentTaskRun = false;
      let hasSubTask2Run = false;

      const parentTask = new TestScheduledTask(() => {
        hasParentTaskRun = true;
      });

      const subTask1 = new TestScheduledTask(() => {
        throw new Error(`It's no fun being a subtask >:(`);
      });
      const subTask2 = new TestScheduledTask(() => {
        hasSubTask2Run = true;
      });
      parentTask.subtasks = [subTask1, subTask2];

      await parentTask.runImmediately();

      expect(hasParentTaskRun).toBe(false);
      expect(hasSubTask2Run).toBe(false);
    });

    it('If a subtask is disabled, it will not run but the parent and other subtasks will', async () => {
      let hasParentTaskRun = false;
      let hasSubTask1Run = false;
      let hasSubTask2Run = false;

      const parentTask = new TestScheduledTask(() => {
        hasParentTaskRun = true;
      });

      const subTask1 = new TestScheduledTask(
        () => {
          hasSubTask1Run = true;
        },
        { enabled: false },
      );
      const subTask2 = new TestScheduledTask(() => {
        hasSubTask2Run = true;
      });
      parentTask.subtasks = [subTask1, subTask2];

      await parentTask.runImmediately();

      expect(hasParentTaskRun).toBe(true);
      expect(hasSubTask1Run).toBe(false);
      expect(hasSubTask2Run).toBe(true);
    });
  });

  describe('queued tasks', () => {
    it('Will not run a task if the queue is empty', async () => {
      let hasRun = false;
      const task = new TestQueuedScheduledTask(() => {
        hasRun = true;
      });

      expect(await task.countQueue()).toBe(0);
      await task.runImmediately();

      expect(hasRun).toBe(false);
    });

    it('Will run a task if the queue is not empty', async () => {
      let hasRun = false;
      const task = new TestQueuedScheduledTask(() => {
        hasRun = true;
      });
      task.queue.push('cat');

      expect(await task.countQueue()).toBe(1);
      await task.runImmediately();

      expect(hasRun).toBe(true);
    });
  });
});
