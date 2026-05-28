import config from 'config';
import { Op } from 'sequelize';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';

// Purges expired AI form-builder chat state (sessions and async jobs). Reads
// already ignore expired rows; this reclaims them so the tables don't grow
// unbounded.
export class FormBuilderChatCleaner extends ScheduledTask {
  getName() {
    return 'FormBuilderChatCleaner';
  }

  constructor(context) {
    const { schedule, jitterTime, enabled } = config.schedules.formBuilderChatCleaner;
    super(schedule, log, jitterTime, enabled);
    this.store = context.store;
  }

  getWhere() {
    return { expiresAt: { [Op.lt]: new Date() } };
  }

  async countQueue() {
    const { AiChatSession, FormBuilderChatJob } = this.store.models;
    const expiredSessions = await AiChatSession.count({ where: this.getWhere() });
    const expiredJobs = await FormBuilderChatJob.count({ where: this.getWhere() });
    return expiredSessions + expiredJobs;
  }

  async run() {
    const { AiChatSession, FormBuilderChatJob } = this.store.models;
    // Models are paranoid; force a hard delete so the rows are actually reclaimed.
    await AiChatSession.destroy({ where: this.getWhere(), force: true });
    await FormBuilderChatJob.destroy({ where: this.getWhere(), force: true });
  }
}
