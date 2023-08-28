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
    for (const session of staleSessions) {
      await completeSyncSession(
        this.store,
        session.id,
        'Session marked as completed due to inactivity',
      );
      const durationMs = Date.now() - session.startTime;
      log.info('StaleSyncSessionCleaner.closedStaleSession', {
        sessionId: session.id,
        durationMs,
        facilityId: session.debugInfo.facilityId,
        deviceId: session.debugInfo.deviceId,
      });
    }
  }
}
