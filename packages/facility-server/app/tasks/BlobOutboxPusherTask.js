import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

// spec: CACHE
// Drives the blob outbox pusher on its own schedule, independent of sync
// sessions. The base class skips a tick while the previous run is still going,
// and the pusher itself guards each blob, so a slow transfer is never doubled.
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
      // Sync runtime not configured (pre-setup-wizard); nothing to push to.
      return;
    }
    await blobOutboxPusher.runOnce();
  }
}
