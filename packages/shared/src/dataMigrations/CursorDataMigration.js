import { DataMigration } from './DataMigration';

/*
 * CursorDataMigration is for SQL data migrations that can return the id of the
 * last modified record. The user inherits from it and defines a query that
 * takes `fromId` and returns `maxId`, as well as (optionally) initialising
 * `lastMaxId`.
 */
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
    const [[{ maxId }], { rowCount }] = await sequelize.query(await this.getQuery(parameters), {
      bind: {
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

  // eslint-disable-next-line no-unused-vars
  async getQuery() {
    throw new Error('you should extend getQuery');
  }
}
