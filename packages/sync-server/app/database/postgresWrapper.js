import { initDatabase } from 'shared/services/database';

export class PostgresWrapper {
  models = null;

  sequelize = null;

  constructor(dbOptions) {
    // init database
    const { sequelize, models } = initDatabase(dbOptions);
    this.sequelize = sequelize;
    this.models = models;
  }

  async close() {
    await this.sequelize.close();
  }

  removeAllOfType(type) {}
  insert(channel, syncRecord) {}
  countSince(channel, since) {}
  findSince(channel, since, { limit, offset }) {}
  markRecordDeleted(channel, id) {}
}
