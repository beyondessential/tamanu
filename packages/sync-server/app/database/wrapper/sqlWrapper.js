import wayfarer from 'wayfarer';
import { initDatabase } from 'shared/services/database';
import { BasicHandler, EncounterHandler } from './handlers';

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
    [
      ['patient', new BasicHandler(this.models.Patient)],
      ['patient/:patientId/encounter', new EncounterHandler(this.models, this.sequelize)],
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

  async upsert(channel, record) {
    return this.channelRouter(channel, (handler, params) => handler.upsert(record, params));
  }

  async countSince(channel, since) {
    return this.channelRouter(channel, (handler, params) =>
      handler.countSince({ ...params, since }),
    );
  }

  async findSince(channel, since, { limit, offset } = {}) {
    return this.channelRouter(channel, (handler, params) =>
      handler.findSince({ ...params, since, limit, offset }),
    );
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
