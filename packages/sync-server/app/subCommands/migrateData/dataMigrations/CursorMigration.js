import { Migration } from './Migration';

export class CursorMigration extends Migration {
  lastMaxId = null;

  started = false;

  constructor(...args) {
    super(...args);
    if (this.constructor === CursorMigration) {
      throw new Error('CursorMigration is abstract');
    }
  }

  async doBatch(limit) {
    const {
      lastMaxId,
      log,
      store: { sequelize },
    } = this;
    this.started = true;
    log.debug('CursorMigration batch started', { lastMaxId });
    const [[{ maxId }], { rowCount }] = await sequelize.query(await this.getQuery(), {
      replacements: {
        fromId: lastMaxId,
        limit,
      },
    });
    log.debug('CursorMigration batch done', { lastMaxId, maxId });
    this.lastMaxId = maxId;
    return rowCount;
  }

  isComplete() {
    return Boolean(this.started && !this.lastMaxId);
  }

  async getQuery() {
    throw new Error('you should extend getQuery');
  }
}
