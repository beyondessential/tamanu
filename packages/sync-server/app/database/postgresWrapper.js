import wayfarer from 'wayfarer';
import { initDatabase } from 'shared/services/database';

const buildChannelRouter = () => {
  const channelRouter = wayfarer();
  ['patient', 'patient/:id', 'reference', 'survey', 'user', 'vaccination'].forEach(route => {
    channelRouter.on(route, (urlParams, argParams, f) => {
      const params = { ...argParams, ...urlParams, route };
      console.log(JSON.stringify(params));
      f(null, params); // TODO: determine model and pass in
    });
  });
  return channelRouter;
};

export class PostgresWrapper {
  models = null;

  sequelize = null;

  constructor(dbOptions) {
    // init database
    const { sequelize, models } = initDatabase(dbOptions);
    this.sequelize = sequelize;
    this.models = models;
    this.channelRouter = buildChannelRouter();
  }

  async close() {
    await this.sequelize.close();
  }

  removeAllOfType(type) {
    console.log(`removeAllOfType ${type}`);
  }

  insert(channel, syncRecord) {
    this.channelRouter(channel, { syncRecord }, () => {});
  }

  countSince(channel, since) {
    this.channelRouter(channel, { since }, () => {});
  }

  findSince(channel, since, { limit, offset } = {}) {
    this.channelRouter(channel, { since, limit, offset }, () => {});
  }

  markRecordDeleted(channel, id) {
    this.channelRouter(channel, { id }, () => {});
  }
}
