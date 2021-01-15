import wayfarer from 'wayfarer';
import { initDatabase } from 'shared/services/database';
import { BasicHandler } from './BasicHandler';
import { EncounterHandler } from './EncounterHandler';
import { AdministeredVaccineHandler } from './AdministeredVaccineHandler';
import { SurveyResponseHandler } from './SurveyResponseHandler';
import { SurveyResponseAnswerHandler } from './SurveyResponseAnswerHandler';

const convertToDbFromSyncRecord = syncRecord => {
  const { data, hashedPassword, lastSynced, ...metadata } = syncRecord;

  return {
    password: hashedPassword,
    ...metadata,
    ...data,
  };
};

const convertToSyncRecordFromDb = dbRecord => {
  const { id, updatedAt, createdAt, deletedAt, password, ...data } = dbRecord;

  return {
    lastSynced: updatedAt?.valueOf(),
    ...(deletedAt ? { isDeleted: true } : {}),
    data: {
      id,
      ...(deletedAt ? {} : data),
    },
  };
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
      ['patient', new BasicHandler(this.models.Patient)],
      ['patient/:patientId/administeredVaccine', new AdministeredVaccineHandler(this.models)],
      ['patient/:patientId/encounter', new EncounterHandler(this.models)],
      ['patient/:patientId/surveyResponse', new SurveyResponseHandler(this.models)],
      ['patient/:patientId/surveyResponseAnswer', new SurveyResponseAnswerHandler(this.models)],
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

  async insert(channel, syncRecord) {
    const record = convertToDbFromSyncRecord(syncRecord);
    return this.channelRouter(channel, (handler, params) => handler.insert(record, params));
  }

  async countSince(channel, since) {
    return this.channelRouter(channel, (handler, params) =>
      handler.countSince({ ...params, since }),
    );
  }

  async findSince(channel, since, { limit, offset } = {}) {
    return this.channelRouter(channel, async (handler, params) => {
      const results = await handler.findSince({ ...params, since, limit, offset });
      return results.map(result => convertToSyncRecordFromDb(result));
    });
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
    return {
      ...convertToSyncRecordFromDb(user.get({ plain: true })),
      hashedPassword: user.password,
    };
  }

  async findUserById(id) {
    const user = await this.models.User.findByPk(id);
    if (!user) {
      return null;
    }
    return {
      ...convertToSyncRecordFromDb(user.get({ plain: true })),
      hashedPassword: user.password,
    };
  }
}
