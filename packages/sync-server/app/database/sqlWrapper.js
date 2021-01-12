import wayfarer from 'wayfarer';
import { Op, Sequelize } from 'sequelize';
import { initDatabase } from 'shared/services/database';

const ensureNumber = input => {
  if (typeof input === 'string') {
    const parsed = parseInt(input, 10);
    return parsed; // might be NaN
  }
  return input;
};

export class SqlWrapper {
  models = null;

  sequelize = null;

  builtRoutes = [];

  constructor(dbOptions) {
    // init database
    this._dbPromise = initDatabase(dbOptions);
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
    [
      ['administeredVaccine', this.models.AdministeredVaccine],
      ['patient', this.models.Patient],
      ['program', this.models.Program],
      ['programDataElement', this.models.ProgramDataElement],
      ['reference', this.models.ReferenceData],
      ['scheduledVaccine', this.models.ScheduledVaccine],
      ['survey', this.models.Survey],
      ['surveyScreenComponent', this.models.SurveyScreenComponent],
      ['user', this.models.User],
    ].forEach(([route, Model]) => {
      if (!Model) {
        throw new Error(`sqlWrapper: model for channel route "${route}" does not exist`);
      }
      this.builtRoutes.push(route);
      channelRouter.on(route, async (urlParams, f) => {
        const params = { ...urlParams, route };
        return f(Model, params);
      });
    });
    return channelRouter;
  }

  // ONLY FOR TESTS, ignores "paranoid"'s soft deletion
  unsafeRemoveAllOfChannel(channel) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('DO NOT use unsafeRemoveAllOfChannel outside tests!');
    }
    return this.channelRouter(channel, async Model => {
      return Model.destroy({ truncate: true, cascade: true, force: true });
    });
  }

  async insert(channel, record) {
    return this.channelRouter(channel, async Model => {
      return Model.upsert(record);
    });
  }

  async countSince(channel, since) {
    return this.channelRouter(channel, async Model => {
      return Model.count({
        where: {
          updatedAt: { [Op.gte]: ensureNumber(since) },
        },
        paranoid: false,
      });
    });
  }

  async findSince(channel, since, { limit, offset } = {}) {
    return this.channelRouter(channel, async Model => {
      const records = await Model.findAll({
        limit,
        offset,
        where: {
          updatedAt: { [Op.gte]: ensureNumber(since) },
        },
        order: ['updated_at', 'id'],
        paranoid: false,
      });
      return records.map(result => result.get({ plain: true }));
    });
  }

  markRecordDeleted(channel, id) {
    return this.channelRouter(channel, async Model => {
      // use update instead of destroy so we can change both fields
      return Model.update(
        {
          deletedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
          updatedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        {
          where: { id },
        },
      ).then(([num]) => num);
    });
  }

  //------------------------------------
  // required for auth middleware

  async findUser(email) {
    const user = await this.models.User.findOne({
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
