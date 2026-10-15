import { Op } from 'sequelize';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

// spec: BTEL
// Prunes raw browser telemetry spans past the retention horizon so the local
// store doesn't grow unbounded. The raw data is only needed until the downstream
// aggregation has rolled it up.
export class CleanupBrowserTelemetry extends ScheduledTask {
  getName() {
    return 'CleanupBrowserTelemetry';
  }

  constructor(context) {
    const { schedule, jitterTime, enabled, retentionDays } =
      context.schedules.cleanupBrowserTelemetry;
    super(schedule, log, jitterTime, enabled);
    this.models = context.models;
    this.retentionDays = retentionDays ?? 30;
  }

  async run() {
    const cutoff = new Date(Date.now() - this.retentionDays * 24 * 60 * 60 * 1000);
    const deleted = await this.models.BrowserTelemetrySpan.destroy({
      where: { occurredAt: { [Op.lt]: cutoff } },
      force: true,
    });
    if (deleted > 0) {
      log.debug('CleanupBrowserTelemetry: removed expired telemetry spans', { deleted });
    }
  }
}
