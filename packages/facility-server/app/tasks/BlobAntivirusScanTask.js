import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

// spec: AV
// The facility's scheduled antivirus pass, where the facility drives a scanner
// of its own. Content it captured is scanned here before it has reached central
// at all, which is the window a facility's own scanner exists to cover.
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
    // Absent when this facility drives no scanner, which is the common case:
    // it serves on central's verdicts instead.
    if (!blobScanner) {
      return;
    }
    await blobScanner.run();
  }
}
