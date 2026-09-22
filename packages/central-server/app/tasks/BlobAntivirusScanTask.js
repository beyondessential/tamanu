import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

// spec: AV
// Central's scheduled antivirus pass. Central scans every blob it holds and its
// verdict is authoritative for the deployment, so this is where an infected
// hash is found and quarantined.
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
    // Absent when no scanner is configured, which is what makes the feature
    // inert rather than merely idle on a deployment that has not turned it on.
    if (!blobScanner) {
      return;
    }
    await blobScanner.run();
  }
}
