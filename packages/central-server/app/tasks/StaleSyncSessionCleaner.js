import { Op } from 'sequelize';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { completeSyncSession } from '@tamanu/shared/sync/completeSyncSession';

export class StaleSyncSessionCleaner extends ScheduledTask {
  getName() {
    return 'StaleSyncSessionCleaner';
  }

  constructor({ schedules, store, settings }) {
    const { jitterTime, schedule } = schedules.staleSyncSessionCleaner;
    super(schedule, log, jitterTime);
    this.store = store;
    this.settings = settings;
  }

  getWhere(staleSessionSeconds) {
    return {
      lastConnectionTime: { [Op.lt]: Date.now() - staleSessionSeconds * 1000 },
      completedAt: { [Op.is]: null },
    };
  }

  async countQueue() {
    const staleSessionSeconds = await this.settings.get(
      'schedules.staleSyncSessionCleaner.staleSessionSeconds',
    );
    const { SyncSession } = this.store.models;
    return SyncSession.count({
      where: this.getWhere(staleSessionSeconds),
    });
  }

  async run() {
    const staleSessionSeconds = await this.settings.get(
      'schedules.staleSyncSessionCleaner.staleSessionSeconds',
    );
    const { SyncSession } = this.store.models;
    const staleSessions = await SyncSession.findAll({
      where: this.getWhere(staleSessionSeconds),
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
