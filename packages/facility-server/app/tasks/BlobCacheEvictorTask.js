import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

// spec: CACHE
// Periodic backstop for the blob cache size budget. Admission-time enforcement
// does the routine work; this sweep catches drift from budget changes, blobs
// whose reads had eviction deferred, and failures during earlier passes.
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
    await blobCache.enforceBudget();
  }
}
