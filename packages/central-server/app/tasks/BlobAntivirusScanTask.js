import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

// spec: AV
// Central's verdict is authoritative, so infected hashes are found and quarantined here.
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
    // Absent when no scanner is configured, which keeps the feature inert.
    if (!blobScanner) {
      return;
    }
    await blobScanner.run();
  }
}
