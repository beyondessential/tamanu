import config from 'config';
import { Op } from 'sequelize';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import { completeSyncSession } from 'shared/sync/completeSyncSession';

export class StaleSyncSessionCleaner extends ScheduledTask {
  getName() {
    return 'StaleSyncSessionCleaner';
  }

  constructor(context) {
    // TODO: Use db config fetcher (cannot use async on constructor)
    const conf = config.schedules.staleSyncSessionCleaner;
    super(conf.schedule, log);
    this.config = conf;
    this.store = context.store;
  }

  getWhere() {
    const { staleSessionSeconds } = this.config;
    return {
      lastConnectionTime: { [Op.lt]: Date.now() - staleSessionSeconds * 1000 },
      completedAt: { [Op.is]: null },
    };
  }

  async countQueue() {
    const { SyncSession } = this.store.models;
    return SyncSession.count({
      where: this.getWhere(),
    });
  }

  async run() {
    const { SyncSession } = this.store.models;
    const staleSessions = await SyncSession.findAll({
      where: this.getWhere(),
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
