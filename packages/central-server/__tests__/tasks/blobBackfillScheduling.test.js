import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ScheduledTask } from '@tamanu/shared/tasks/ScheduledTask';

import { createTestContext } from '../utilities';
import { startScheduledTasks } from '../../app/tasks';

// spec: BKFL
// The backfill runs from server start with no operator action, which means it
// is among the tasks the server schedules on boot rather than something an
// operator has to kick off.
describe('BlobBackfillTask scheduling', () => {
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
  });

  afterAll(() => ctx.close());

  it('is scheduled, enabled, when the server starts its tasks', async () => {
    const polled = [];
    // Recorded rather than called through, so no cron jobs outlive the test.
    const beginPolling = vi
      .spyOn(ScheduledTask.prototype, 'beginPolling')
      .mockImplementation(function record() {
        polled.push({ name: this.getName(), enabled: this.isEnabled, schedule: this.schedule });
      });

    const stopTasks = await startScheduledTasks(ctx);
    try {
      expect(polled).toContainEqual(
        expect.objectContaining({ name: 'BlobBackfillTask', enabled: true }),
      );
      expect(polled.find(({ name }) => name === 'BlobBackfillTask').schedule).toBeTruthy();
    } finally {
      stopTasks();
      beginPolling.mockRestore();
    }
  });
});
