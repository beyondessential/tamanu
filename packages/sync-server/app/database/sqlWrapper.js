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

class BasicHandler {
  model = null;

  constructor(Model) {
    if (!Model) {
      throw new Error(`BasicHandler: must pass a model`);
    }
    this.Model = Model;
  }

  // ONLY FOR TESTS, ignores "paranoid"'s soft deletion
  async unsafeRemoveAll() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('DO NOT use unsafeRemoveAllOfChannel outside tests!');
    }
    return this.Model.destroy({ truncate: true, cascade: true, force: true });
  }

  async insert(record) {
    return this.Model.upsert(record);
  }

  async countSince(since) {
    return this.Model.count({
      where: {
        updatedAt: { [Op.gte]: ensureNumber(since) },
      },
      paranoid: false,
    });
  }

  async findSince(since, { limit, offset } = {}) {
    const records = await this.Model.findAll({
      limit,
      offset,
      where: {
        updatedAt: { [Op.gte]: ensureNumber(since) },
      },
      order: ['updated_at', 'id'],
      paranoid: false,
    });
    return records.map(result => result.get({ plain: true }));
  }

  async markRecordDeleted(id) {
    // use update instead of destroy so we can change both fields
    const [num] = await this.Model.update(
      {
        deletedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
        updatedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      {
        where: { id },
      },
    );
    return num;
  }
}

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
      ['patient', new BasicHandler(this.models.Patient)],
      // ['patient/:patientId/administeredVaccine', this.models.AdministeredVaccine],
      // ['patient/:patientId/encounter', this.models.Encounter],
      // ['patient/:patientId/surveyResponse', this.models.SurveyResponse],
      // ['patient/:patientId/surveyResponseAnswer', this.models.SurveyResponseAnswer],
      ['program', new BasicHandler(this.models.Program)],
      ['programDataElement', new BasicHandler(this.models.ProgramDataElement)],
      ['reference', new BasicHandler(this.models.ReferenceData)],
      ['scheduledVaccine', new BasicHandler(this.models.ScheduledVaccine)],
      ['survey', new BasicHandler(this.models.Survey)],
      ['surveyScreenComponent', new BasicHandler(this.models.SurveyScreenComponent)],
      ['user', new BasicHandler(this.models.User)],
    ].forEach(([route, handler]) => {
      this.builtRoutes.push(route);
      channelRouter.on(route, async (urlParams, f) => {
        const params = { ...urlParams, route };
        return f(handler, params);
      });
    });
    return channelRouter;
  }

  // ONLY FOR TESTS, ignores "paranoid"'s soft deletion
  async unsafeRemoveAllOfChannel(channel) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('DO NOT use unsafeRemoveAllOfChannel outside tests!');
    }
    return this.channelRouter(channel, handler => handler.unsafeRemoveAll());
  }

  async insert(channel, record) {
    return this.channelRouter(channel, handler => handler.insert(record));
  }

  async countSince(channel, since) {
    return this.channelRouter(channel, handler => handler.countSince(since));
  }

  async findSince(channel, since, { limit, offset } = {}) {
    return this.channelRouter(channel, handler => handler.findSince(since, { limit, offset }));
  }

  async markRecordDeleted(channel, id) {
    return this.channelRouter(channel, handler => handler.markRecordDeleted(id));
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
