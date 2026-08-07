import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

// spec: SCRUB
// The facility's scheduled blob integrity scrub. Reads cold content that no
// clinical workflow would otherwise touch, so corruption is found before the
// day someone needs the file rather than on that day.
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
