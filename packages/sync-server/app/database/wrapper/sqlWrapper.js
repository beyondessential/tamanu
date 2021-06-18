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
    [
      ['labTestType', this.models.LabTestType],
      ['patient', this.models.Patient],
      ['patient/:patientId/allergy', this.models.PatientAllergy],
      ['patient/:patientId/carePlan', this.models.PatientCarePlan],
      ['patient/:patientId/condition', this.models.PatientCondition],
      ['patient/:patientId/encounter', this.models.Encounter],
      ['patient/:patientId/familyHistory', this.models.PatientFamilyHistory],
      ['patient/:patientId/issue', this.models.PatientIssue],
      ['patient/:patientId/additionalData', this.models.PatientAdditionalData],
      ['program', this.models.Program],
      ['programDataElement', this.models.ProgramDataElement],
      ['reference', this.models.ReferenceData],
      ['scheduledVaccine', this.models.ScheduledVaccine],
      ['survey', this.models.Survey],
      ['surveyScreenComponent', this.models.SurveyScreenComponent],
      ['user', this.models.User],
      ['reportRequest', this.models.ReportRequest],
      ['facility', this.models.Facility],
      ['department', this.models.Department],
      ['location', this.models.Location],
      ['userFacility', this.models.UserFacility],
      ['attachment', this.models.Attachment],
      ['asset', this.models.Asset],
    ].forEach(([route, model]) => {
      this.builtRoutes.push(route);
      // TODO: deprecate handlers
      if (!model) {
        throw new Error(`SqlWrapper: no model for route ${route}`);
      }
      const handler = new BasicHandler(model);
      channelRouter.on(route, async (urlParams, f) => {
        const params = { ...urlParams, route };
        return f(handler, params, model);
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
