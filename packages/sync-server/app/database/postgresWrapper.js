import wayfarer from 'wayfarer';
import { Op } from 'sequelize';
import { initDatabase } from 'shared/services/database';

export class PostgresWrapper {
  models = null;

  sequelize = null;

  constructor(dbOptions) {
    // init database
    const { sequelize, models } = initDatabase(dbOptions);
    this.sequelize = sequelize;
    this.models = models;
    this.channelRouter = this.buildChannelRouter();
  }

  async close() {
    await this.sequelize.close();
  }

  buildChannelRouter() {
    const channelRouter = wayfarer();
    [
      ['patient', this.models.Patient],
      ['patient/:id/todo', this.models.Todo],
      ['reference', this.models.ReferenceData],
      ['survey', this.models.Survey],
      ['user', this.models.User],
      ['vaccination', this.models.Vaccination],
    ].forEach(([route, model]) => {
      channelRouter.on(route, async (urlParams, f) => {
        const params = { ...urlParams, route };
        console.log(JSON.stringify(params));
        return f(model, params);
      });
    });
    return channelRouter;
  }

  // TODO: this will need to be adapted to channels instead of types
  removeAllOfType(type) {
    console.log(`removeAllOfType ${type}`);
  }

  insert(channel, syncRecord) {
    this.channelRouter(channel, () => {});
  }

  countSince(channel, since) {
    this.channelRouter(channel, () => {});
  }

  async findSince(channel, since, { limit, offset } = {}) {
    return this.channelRouter(channel, async model => {
      return model.findAll({
        limit,
        offset,
        where: {
          updatedAt: { [Op.gte]: since },
        },
      });
    });
  }

  markRecordDeleted(channel, id) {
    this.channelRouter(channel, () => {});
  }
}
