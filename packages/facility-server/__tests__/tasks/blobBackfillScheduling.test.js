import { ScheduledTask } from '@tamanu/shared/tasks/ScheduledTask';

import { createTestContext } from '../utilities';
import { startScheduledTasks } from '../../app/tasks';

// spec: BKFL
// A facility runs the backfill from server start with no operator action, so the
// task belongs to the set the server schedules on boot rather than to something
// someone has to kick off on each site.
describe('BlobBackfillTask scheduling', () => {
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
  });

  afterAll(() => ctx.close());

  it('is scheduled, enabled, when the server starts its tasks', async () => {
    const polled = [];
    // Recorded rather than called through, so no cron jobs outlive the test.
    const beginPolling = jest
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
