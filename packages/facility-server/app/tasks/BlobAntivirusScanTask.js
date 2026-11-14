import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

// spec: AV
// Covers the window before captured content reaches central.
export class BlobAntivirusScanTask extends ScheduledTask {
  getName() {
    return 'BlobAntivirusScanTask';
  }

  constructor(context) {
    const { schedule, jitterTime, enabled } = context.schedules.blobAntivirusScan;
    super(schedule, log, jitterTime, enabled);
    this.context = context;
  }

  async run() {
    const { blobScanner } = this.context;
    // The common case: the facility serves on central verdicts.
    if (!blobScanner) {
      return;
    }
    await blobScanner.run();
  }
}
