import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

// spec: CACHE
// Backstop for admission-time enforcement. Demotes stranded outbox blobs first: nothing else
// reclaims them.
export class BlobCacheEvictorTask extends ScheduledTask {
  getName() {
    return 'BlobCacheEvictorTask';
  }

  constructor(context) {
    const { schedule, jitterTime, enabled } = context.schedules.blobCacheEvictor;
    super(schedule, log, jitterTime, enabled);
    this.context = context;
  }

  async run() {
    const { blobCache } = this.context;
    if (!blobCache) {
      return;
    }
    await blobCache.demoteStrandedOutbox();
    await blobCache.enforceBudget();
  }
}
