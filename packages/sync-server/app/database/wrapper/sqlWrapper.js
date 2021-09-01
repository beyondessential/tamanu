import { Sequelize, Op } from 'sequelize';
import { initDatabase } from 'shared/services/database';
import { syncCursorToWhereCondition } from 'shared/models/sync';

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
  } 

  async countSince(channel, since) {
    return this.sequelize.channelRouter(channel, (model, params, channelRoute) => {
      const { where, include } = channelRoute.queryFromParams(params);
      return model.count({
        paranoid: false,
        where: {
          [Op.and]: [syncCursorToWhereCondition(since), where],
        },
        include,
      });
    });
  }

  async markRecordDeleted(channel, id) {
    return this.sequelize.channelRouter(channel, async model => {
      // use update instead of destroy so we can change both fields
      const [num] = await model.update(
        {
          deletedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
          updatedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        {
          where: { id },
        },
      );
      return num;
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
