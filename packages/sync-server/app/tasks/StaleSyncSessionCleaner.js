import config from 'config';
import { Op } from 'sequelize';
import { InvalidConfigError } from 'shared/errors';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import { completeSyncSession } from 'shared/sync/completeSyncSession';

export class StaleSyncSessionCleaner extends ScheduledTask {
  getName() {
    return 'StaleSyncSessionCleaner';
  }

  constructor(context) {
    const conf = config.schedules.staleSyncSessionCleaner;
    super(conf.schedule, log);
    this.config = conf;
    this.store = context.store;
  }

  async run() {
    const { SyncSession } = this.store.models;

    const { staleSessionSeconds } = this.config;
    if (!staleSessionSeconds) {
      throw new InvalidConfigError(`staleSessionSeconds must be set for ${this.getName()}`);
    }

    const staleSessions = await SyncSession.findAll({
      where: {
        lastConnectionTime: { [Op.lt]: Date.now() - staleSessionSeconds * 1000 },
        completedAt: { [Op.is]: null },
      },
      select: ['id'],
      raw: true,
    });
    for (const { id: sessionId } of staleSessions) {
      await completeSyncSession(
        this.store,
        sessionId,
        'Session marked as completed due to inactivity',
      );
    }
  }
}
