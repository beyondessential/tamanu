import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

// spec: CACHE
// The base class skips a tick while the previous run is going, so a slow transfer is never doubled.
export class BlobOutboxPusherTask extends ScheduledTask {
  getName() {
    return 'BlobOutboxPusherTask';
  }

  constructor(context) {
    const { schedule, jitterTime, enabled } = context.schedules.blobOutboxPusher;
    super(schedule, log, jitterTime, enabled);
    this.context = context;
  }

  async run() {
    const { blobOutboxPusher } = this.context;
    if (!blobOutboxPusher) {
      // Pre-setup-wizard: nothing to push to.
      return;
    }
    await blobOutboxPusher.runOnce();
  }
}
