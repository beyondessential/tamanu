import { DataMigration } from './DataMigration';

export class CursorDataMigration extends DataMigration {
  lastMaxId = null;

  started = false;

  constructor(...args) {
    super(...args);
    if (this.constructor === CursorDataMigration) {
      throw new Error('CursorDataMigration is abstract');
    }
  }

  async doBatch(limit) {
    const {
      lastMaxId,
      log,
      store: { sequelize },
    } = this;
    this.started = true;
    log.debug('CursorDataMigration batch started', { lastMaxId });
    const [[{ maxId }], { rowCount }] = await sequelize.query(await this.getQuery(), {
      replacements: {
        fromId: lastMaxId,
        limit,
      },
    });
    log.debug('CursorDataMigration batch done', { lastMaxId, maxId });
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
