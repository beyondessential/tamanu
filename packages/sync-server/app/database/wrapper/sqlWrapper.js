import { initDatabase } from 'shared/services/database';
import { BasicHandler } from './handlers';

export class SqlWrapper {
  models = null;

  sequelize = null;

  constructor(dbOptions) {
    // init database
    this._dbPromise = initDatabase({
      ...dbOptions,
      hackToSkipEncounterValidation: true, // TODO: remove once mobile implements all relationships
    });
  }

  async init() {
    const { sequelize, models } = await this._dbPromise;
    this.sequelize = sequelize;
    this.models = models;
    return this;
  }

  async close() {
    await this.sequelize.close();
  }

  async countSince(channel, since) {
    return this.sequelize.channelRouter(channel, (model, params) => {
      const handler = new BasicHandler(model);
      return handler.countSince({ since }, params);
    });
  }

  async markRecordDeleted(channel, id) {
    return this.sequelize.channelRouter(channel, model => {
      const handler = new BasicHandler(model);
      return handler.markRecordDeleted(id);
    });
  }
  //------------------------------------
  // required for auth middleware

  async findUser(email) {
    const user = await this.models.User.scope('withPassword').findOne({
      where: { email },
    });
    if (!user) {
      return null;
    }
    return user.get({ plain: true });
  }

  async findUserById(id) {
    const user = await this.models.User.findByPk(id);
    if (!user) {
      return null;
    }
    return user.get({ plain: true });
  }
}
