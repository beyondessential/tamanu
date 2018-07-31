import Backbone from 'backbone-associations';
import shortid from 'shortid';
import { defaults, each, clone, merge, set } from 'lodash';
import BaseModel from './base';
import mapRelations from '../utils/map-relations';
// import SurveyModel from './survey';

export default BaseModel.extend({
  defaults: () => defaults(
    {
      _id: `patient_${shortid.generate()}`,
      docType: 'patient',
      displayId: '',
      admitted: false,
      additionalContacts: [],
      address: '',
      address2: '',
      address3: '',
      address4: '',
      bloodType: '',
      clinic: '',
      country: '',
      checkedIn: false,
      dateOfBirth: '',
      economicClassification: '',
      email: '',
      externalPatientId: '',
      familySupport1: '',
      familySupport2: '',
      familySupport3: '',
      familySupport4: '',
      familySupport5: '',
      familyInfo: [],
      firstName: '',
      sex: '',
      occupation: '',
      history: '', // No longer used
      insurance: '',
      lastName: '',
      livingArrangement: '',
      middleName: '',
      culturalName: '',
      notes: '',
      otherIncome: '',
      patientType: '',
      parent: '',
      phone: '',
      placeOfBirth: '',
      referredDate: Date,
      referredBy: '',
      religion: '',
      socialActionTaken: '',
      socialRecommendation: '',
      status: '',
      allergies: [],
      diagnoses: [],
      operationReports: [],
      operativePlans: [],
      pregnancies: [],
      surveyResponses: [],
    },
    BaseModel.prototype.defaults
  ),

  // Associations
  relations: [
    {
      type: Backbone.Many,
      key: 'allergies',
      relatedModel: () => require('./allergy'),
      map: (values) => mapRelations(values, require('./allergy')),
      serialize: '_id'
    },
    {
      type: Backbone.Many,
      key: 'diagnoses',
      relatedModel: () => require('./diagnosis'),
      map: (values) => mapRelations(values, require('./diagnosis')),
      serialize: '_id'
    },
    {
      type: Backbone.Many,
      key: 'operationReports',
      relatedModel: () => require('./operationReport'),
      map: (values) => mapRelations(values, require('./operationReport')),
      serialize: '_id'
    },
    {
      type: Backbone.Many,
      key: 'operativePlans',
      relatedModel: () => require('./operativePlan'),
      map: (values) => mapRelations(values, require('./operativePlan')),
      serialize: '_id'
    },
    {
      type: Backbone.Many,
      key: 'pregnancies',
      relatedModel: () => require('./pregnancy'),
      map: (values) => mapRelations(values, require('./pregnancy')),
      serialize: '_id'
    },
    {
      type: Backbone.Many,
      key: 'surveyResponses',
      relatedModel: () => require('./surveyResponse'),
      map: (values) => mapRelations(values, require('./surveyResponse')),
      serialize: '_id'
    },
  ],

  validate(attrs) {
    if (attrs.firstName === '') return 'firstName is required!';
    if (attrs.lastName === '') return 'lastName is required!';
  },

  getOpenPlan() {
    let _return = {};
    if (this.attributes.operativePlans.models.length > 0) {
      each(this.attributes.operativePlans.models, (opPlan) => {
        const operationPlan = clone(opPlan.attributes);
        if (operationPlan.status === 'planned') _return = opPlan.toJSON();
      });
    }

    return _return;
  },

  getProcedures() {
    const operationReports = this.get('operationReports');
    let allProcedures = [];
    operationReports.models.forEach((model) => {
      const { procedures, surgeryDate: date, _id: operationReportId } = model.toJSON();
      allProcedures = merge(allProcedures, procedures.map(name => { return { name, date, operationReportId }; }));
    });

    return allProcedures;
  },

  getCompletedSurveys() {
    return new Promise(async (resolve, reject) => {
      const SurveyModel = require('./survey');
      const tasks = [];
      const surveyResponses = this.get('surveyResponses');
      surveyResponses.models.forEach(resp => tasks.push(resp.fetch({ relations: true })));
      // surveyResponses = surveyResponses.map(resp => {
      //   const m = new SurveyModel();
      //   console.log('_1_model_1_', m, require('./survey'));
      //   m.set({ _id: resp._id });
      //   tasks.push(m.fetch());
      //   set(resp, 'survey', m);
      //   return resp;
      // });

      const models = await Promise.all(tasks);
      console.log('--surveyResponses--', models);
      resolve([]);

      // try {
      //   await Promise.all(tasks);
      //   surveyResponses.map(resp => {
      //     resp.survey = resp.survey.toJSON();
      //   });
      //   console.log('--surveyResponses--', surveyResponses);
      //   resolve([]);
      // } catch (err) {
      //   reject(err);
      // }
    });
  }
});
