import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

// spec: SCRUB
// Central's scheduled blob integrity scrub. Central holds the authoritative
// copy of every blob in the deployment, so this is the scrub that finds loss
// which no other server can make good.
export class BlobIntegrityScrubTask extends ScheduledTask {
  getName() {
    return 'BlobIntegrityScrubTask';
  }

  constructor(context) {
    const { schedule, jitterTime, enabled } = context.schedules.blobIntegrityScrub;
    super(schedule, log, jitterTime, enabled);
    this.context = context;
  }

  async run() {
    const { blobScrubber } = this.context;
    if (!blobScrubber) {
      return;
    }
    await blobScrubber.run();
  }
}
