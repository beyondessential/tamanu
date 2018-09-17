import Backbone from 'backbone-associations';
import shortid from 'shortid';
import { defaults, each, clone, isEmpty, get, filter, capitalize, sortBy, concat } from 'lodash';
import moment from 'moment';
import BaseModel from './base';
import mapRelations from '../utils/map-relations';
import { pregnancyOutcomes, dateFormat } from '../constants';
// import SurveyModel from './survey';

export default BaseModel.extend({
  defaults: () => defaults({
    _id: `patient_${shortid.generate()}`,
    docType: 'patient',
    displayId: '',
    admitted: false,
    address: '',
    address2: '',
    address3: '',
    address4: '',
    bloodType: '',
    clinic: '',
    country: '',
    checkedIn: false,
    dateOfBirth: null,
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
    referredDate: null,
    referredBy: '',
    religion: '',
    socialActionTaken: '',
    socialRecommendation: '',
    status: '',

    additionalContacts: [],
    allergies: [],
    diagnoses: [],
    operationReports: [],
    operativePlans: [],
    pregnancies: [],
    surveyResponses: [],
    visits: [],
  }, BaseModel.prototype.defaults),

  // Associations
  relations: [
    {
      type: Backbone.Many,
      key: 'additionalContacts',
      relatedModel: () => require('./patientContact'),
      map: (values) => mapRelations(values, require('./patientContact')),
      serialize: '_id'
    }, {
      type: Backbone.Many,
      key: 'allergies',
      relatedModel: () => require('./allergy'),
      map: (values) => mapRelations(values, require('./allergy')),
      serialize: '_id'
    }, {
      type: Backbone.Many,
      key: 'diagnoses',
      relatedModel: () => require('./diagnosis'),
      map: (values) => mapRelations(values, require('./diagnosis')),
      serialize: '_id'
    }, {
      type: Backbone.Many,
      key: 'operationReports',
      relatedModel: () => require('./operationReport'),
      map: (values) => mapRelations(values, require('./operationReport')),
      serialize: '_id'
    }, {
      type: Backbone.Many,
      key: 'operativePlans',
      relatedModel: () => require('./operativePlan'),
      map: (values) => mapRelations(values, require('./operativePlan')),
      serialize: '_id'
    }, {
      type: Backbone.Many,
      key: 'pregnancies',
      relatedModel: () => require('./pregnancy'),
      map: (values) => mapRelations(values, require('./pregnancy')),
      serialize: '_id'
    }, {
      type: Backbone.Many,
      key: 'surveyResponses',
      relatedModel: () => require('./surveyResponse'),
      map: (values) => mapRelations(values, require('./surveyResponse')),
      serialize: '_id'
    }, {
      type: Backbone.Many,
      key: 'visits',
      relatedModel: () => require('./visit'),
      map: (values) => mapRelations(values, require('./visit')),
      serialize: '_id',
      collectionType: require('../collections/visits')
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
      allProcedures = allProcedures.concat(procedures.map(name => { return { name, date, operationReportId }; }));
    });

    return allProcedures;
  },

  getPregnancies() {
    const pregnancies = this.get('pregnancies');
    return pregnancies.models.map((p, k) => {
      const _item = clone(p.attributes);
      _item.label = `Pregnancy ${k + 1}`;
      _item.conceiveDate = moment(_item.conceiveDate).format(dateFormat);
      if (_item.outcome === '' || _item.outcome === 'fetalDeath') {
        _item.deliveryDate = '';
        _item.child = '';
      }
      if (_item.deliveryDate !== '') _item.deliveryDate = moment(_item.deliveryDate).format(dateFormat);
      _item.outcomeLabel = get(filter(pregnancyOutcomes, outcome => outcome.value === _item.outcome)[0], 'label');
      return _item;
    });
  },

  getVisitsSelect() {
    let visits = this.get('visits').toJSON();
    visits = visits.map(visit => {
      const label = [];
      label.push(moment(visit.startDate).format(dateFormat));
      if (visit.endDate !== null) label.push(` - ${moment(visit.endDate).format(dateFormat)}`);
      label.push(` (${capitalize(visit.visitType)})`);

      return {
        value: visit._id,
        label: label.concat(),
      };
    });
    return visits;
  },

  getCurrentAdmission() {
    // await this.fetch({ relations: ['visits'] });
    const { visits } = this.attributes;
    return visits.findWhere({ visitType: 'admission', endDate: null });
  },

  async getHistory() {
    let history = [];
    let { visits } = this.attributes;
    visits = visits.map(visit => visit.toJSON({ relations: true }));
    if (!isEmpty(visits)) history = concat(history, visits.map(visit => ({ date: visit.startDate, ...visit })));
    return history;
  }
});
