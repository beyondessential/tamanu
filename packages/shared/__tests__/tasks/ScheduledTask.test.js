import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { addMilliseconds, addHours, addDays, addMonths, isWithinInterval } from 'date-fns';

import { ScheduledTask, recordScheduledTaskRuns } from '../../src/tasks/ScheduledTask';
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
vi.useFakeTimers().setSystemTime(systemTime);

vi.mock('@tamanu/utils/sleepAsync', () => {
  return {
    sleepAsync: (ms) => {
      // Update the Date.now() whenever we sleep to mock the jitter behaviour
      vi.useFakeTimers().setSystemTime(addMilliseconds(systemTime, ms));
    },
  };
});
vi.mock('shortid', () => ({ default: () => 'test-task-id' }));

describe('ScheduledTask', () => {
  beforeAll(() => {});

  afterEach(() => {
    vi.useFakeTimers().setSystemTime(systemTime);
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

  describe('run state', () => {
    const makeRunState = ({ isHeld = false } = {}) => {
      const calls = [];
      return {
        calls,
        startRun: vi.fn(async name => {
          calls.push(['start', name]);
          return !isHeld;
        }),
        finishRun: vi.fn(async name => {
          calls.push(['finish', name]);
        }),
        clearRunning: vi.fn(async () => {}),
      };
    };

    it('Records the start and finish of a run around it', async () => {
      const runState = makeRunState();
      const task = new TestScheduledTask(() => {
        runState.calls.push(['run']);
      });
      task.recordRunsIn(runState);

      expect(await task.runImmediately()).toBe(true);

      expect(runState.calls).toEqual([
        ['start', 'TestScheduledTask'],
        ['run'],
        ['finish', 'TestScheduledTask'],
      ]);
    });

    it('Skips an overlapping call while a run is still recording its start', async () => {
      const runState = makeRunState();
      let finishRecordingStart;
      runState.startRun.mockImplementationOnce(async name => {
        runState.calls.push(['start', name]);
        await new Promise(resolve => {
          finishRecordingStart = resolve;
        });
        return true;
      });
      const task = new TestScheduledTask(() => {
        runState.calls.push(['run']);
      });
      task.recordRunsIn(runState);

      const firstRun = task.runImmediately();
      await vi.waitFor(() => expect(finishRecordingStart).toBeDefined());
      expect(await task.runImmediately()).toBe(false);
      finishRecordingStart();
      expect(await firstRun).toBe(true);

      expect(runState.calls).toEqual([
        ['start', 'TestScheduledTask'],
        ['run'],
        ['finish', 'TestScheduledTask'],
      ]);
    });

    it('Records the finish of a run that fails', async () => {
      const runState = makeRunState();
      const task = new TestScheduledTask(() => {
        throw new Error('task failed');
      });
      task.recordRunsIn(runState);

      expect(await task.runImmediately()).toBe(false);

      expect(runState.finishRun).toHaveBeenCalledWith('TestScheduledTask');
    });

    it('Skips a run while scheduled tasks are held', async () => {
      const runState = makeRunState({ isHeld: true });
      let hasRun = false;
      const task = new TestScheduledTask(() => {
        hasRun = true;
      });
      task.recordRunsIn(runState);

      expect(await task.runImmediately()).toBe(false);

      expect(hasRun).toBe(false);
      expect(runState.finishRun).not.toHaveBeenCalled();
    });

    it('Does not record a run when the queue is empty', async () => {
      const runState = makeRunState();
      const task = new TestQueuedScheduledTask();
      task.recordRunsIn(runState);

      await task.runImmediately();

      expect(runState.startRun).not.toHaveBeenCalled();
    });

    it('Runs the task when recording its start fails', async () => {
      const runState = makeRunState();
      runState.startRun.mockRejectedValue(new Error('database unavailable'));
      let hasRun = false;
      const task = new TestScheduledTask(() => {
        hasRun = true;
      });
      task.recordRunsIn(runState);

      expect(await task.runImmediately()).toBe(true);

      expect(hasRun).toBe(true);
      // nothing was recorded as started, so there is nothing to finish
      expect(runState.finishRun).not.toHaveBeenCalled();
    });

    it('Succeeds when recording the finish fails', async () => {
      const runState = makeRunState();
      runState.finishRun.mockRejectedValue(new Error('database unavailable'));
      const task = new TestScheduledTask(() => {});
      task.recordRunsIn(runState);

      expect(await task.runImmediately()).toBe(true);
    });

    it('Records the runs of subtasks, and a held subtask stops its parent', async () => {
      const runState = makeRunState({ isHeld: true });
      let hasParentRun = false;
      const parentTask = new TestScheduledTask(() => {
        hasParentRun = true;
      });
      class TestSubtask extends TestScheduledTask {
        getName() {
          return 'TestSubtask';
        }
      }
      parentTask.subtasks = [new TestSubtask()];
      parentTask.recordRunsIn(runState);

      await parentTask.runImmediately();

      expect(runState.startRun).toHaveBeenCalledWith('TestSubtask');
      expect(hasParentRun).toBe(false);
    });

    it('Clears the running state of the tasks it starts recording, subtasks included', async () => {
      const runState = makeRunState();
      class TestSubtask extends TestScheduledTask {
        getName() {
          return 'TestSubtask';
        }
      }
      const parentTask = new TestScheduledTask();
      parentTask.subtasks = [new TestSubtask()];

      await recordScheduledTaskRuns([parentTask], { ScheduledTaskState: runState });

      expect(runState.clearRunning).toHaveBeenCalledWith(['TestScheduledTask', 'TestSubtask']);
      expect(parentTask.runState).toBe(runState);
      expect(parentTask.subtasks[0].runState).toBe(runState);
    });

    it('Records runs even when clearing the running state fails', async () => {
      const runState = makeRunState();
      runState.clearRunning.mockRejectedValue(new Error('database unavailable'));
      const task = new TestScheduledTask();

      await recordScheduledTaskRuns([task], { ScheduledTaskState: runState });

      expect(task.runState).toBe(runState);
    });
  });
});
