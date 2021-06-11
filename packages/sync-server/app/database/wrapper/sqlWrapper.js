import wayfarer from 'wayfarer';
import { initDatabase } from 'shared/services/database';
import { BasicHandler } from './handlers';

export class SqlWrapper {
  models = null;

  sequelize = null;

  builtRoutes = [];

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
    this.channelRouter = this.buildChannelRouter();
    return this;
  }

  async close() {
    await this.sequelize.close();
  }

  buildChannelRouter() {
    const channelRouter = wayfarer();
    for (const model of Object.values(this.models)) {
      for (const route of model.channelRoutes) {
        this.builtRoutes.push(route);
        const handler = new BasicHandler(model); // TODO: deprecate handlers
        channelRouter.on(route, async (urlParams, f) => {
          const params = { ...urlParams, route };
          return f(handler, params, model);
        });
      }
    }
    return channelRouter;
  }

  // ONLY FOR TESTS, ignores "paranoid"'s soft deletion
  async unsafeRemoveAllOfChannel(channel) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('DO NOT use unsafeRemoveAllOfChannel outside tests!');
    }
    return this.channelRouter(channel, handler => handler.unsafeRemoveAll());
  }

  async upsert(channel, record) {
    return this.channelRouter(channel, (handler, params) =>
      handler.upsert(record, params, channel),
    );
  }

  // TODO: this is a hack to enable sharing import/export across sync and lan
  async withModel(channel, f) {
    return this.channelRouter(channel, (handler, params, model) => f(model));
  }

  async countSince(channel, since) {
    return this.channelRouter(channel, (handler, params) =>
      handler.countSince({ ...params, since }, channel),
    );
  }

  async findSince(channel, since, { limit, offset } = {}) {
    return this.channelRouter(channel, (handler, params) =>
      handler.findSince({ ...params, since, limit, offset }, channel),
    );
  }

  async markRecordDeleted(channel, id) {
    return this.channelRouter(channel, handler => handler.markRecordDeleted(id));
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
