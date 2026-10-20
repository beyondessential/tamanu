import { Op } from 'sequelize';

import { ScheduledTask } from './ScheduledTask';
import { log } from '../services/logging';

// How many rows to remove per statement. The table is high-volume — a row per
// navigation plus one per API request within it, from every web client — so a
// month of retention can run to millions of rows. One unbounded DELETE would
// hold a long transaction and spike WAL on facility servers with a small
// work_mem, so the prune walks through in bounded chunks instead.
const DELETE_BATCH_SIZE = 10000;

// spec: BTEL
// Prunes raw browser telemetry spans past the retention horizon so the local
// store doesn't grow unbounded. The raw data is only needed until the downstream
// aggregation has rolled it up.
//
// Ages rows by `createdAt` — when this server received them — rather than
// `occurredAt`, which the browser reports and an anonymous client could set far
// in the future to keep its rows from ever being pruned.
export class CleanupBrowserTelemetry extends ScheduledTask {
  getName() {
    return 'CleanupBrowserTelemetry';
  }

  constructor(context) {
    const { schedule, jitterTime, enabled } = context.schedules.cleanupBrowserTelemetry;
    super(schedule, log, jitterTime, enabled);
    this.models = context.models;
    // Retention is a global telemetry setting (shared by the facility and central
    // prune tasks), resolved onto the context at startup like the schedules are.
    this.retentionDays = context.telemetrySettings?.retentionDays ?? 30;
  }

  async run() {
    const cutoff = new Date(Date.now() - this.retentionDays * 24 * 60 * 60 * 1000);
    const { BrowserTelemetrySpan } = this.models;

    let deleted = 0;
    for (;;) {
      const expired = await BrowserTelemetrySpan.findAll({
        attributes: ['id'],
        where: { createdAt: { [Op.lt]: cutoff } },
        limit: DELETE_BATCH_SIZE,
        raw: true,
      });
      if (expired.length === 0) break;

      deleted += await BrowserTelemetrySpan.destroy({
        where: { id: expired.map(({ id }) => id) },
        force: true,
      });

      if (expired.length < DELETE_BATCH_SIZE) break;
    }

    if (deleted > 0) {
      log.debug('CleanupBrowserTelemetry: removed expired telemetry spans', { deleted });
    }
  }
}
