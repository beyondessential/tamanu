import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

// spec: RECL
// Central's scheduled orphan collection. Nothing waits on the space an orphan
// occupies, so this runs daily and does the least it can get away with.
export class BlobOrphanCollectionTask extends ScheduledTask {
  getName() {
    return 'BlobOrphanCollectionTask';
  }

  constructor(context) {
    const { schedule, jitterTime, enabled } = context.schedules.blobOrphanCollection;
    super(schedule, log, jitterTime, enabled);
    this.context = context;
  }

  async run() {
    const { blobReclaimer } = this.context;
    if (!blobReclaimer) {
      return;
    }
    await blobReclaimer.run();
  }
}
