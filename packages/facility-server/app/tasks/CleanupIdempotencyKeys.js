import config from 'config';
import { Op } from 'sequelize';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

// spec: IDEM
// Removes idempotency-key records past their retention horizon so the table
// doesn't grow unbounded. Records are only useful for the client's retry window.
export class CleanupIdempotencyKeys extends ScheduledTask {
  getName() {
    return 'CleanupIdempotencyKeys';
  }

  constructor(context) {
    const { schedule, jitterTime, enabled } = config.schedules.cleanupIdempotencyKeys;
    super(schedule, log, jitterTime, enabled);
    this.models = context.models;
  }

  async run() {
    const deleted = await this.models.IdempotencyKey.destroy({
      where: { expiresAt: { [Op.lt]: new Date() } },
      force: true,
    });
    if (deleted > 0) {
      log.debug('CleanupIdempotencyKeys: removed expired idempotency keys', { deleted });
    }
  }
}
