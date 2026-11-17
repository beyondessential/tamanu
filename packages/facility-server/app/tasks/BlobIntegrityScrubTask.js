import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

// spec: SCRUB
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
