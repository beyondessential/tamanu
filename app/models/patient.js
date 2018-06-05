import Backbone from 'backbone-associations';
import shortid from 'shortid';
import { defaults, isEmpty, map, uniq, filter, isArray, every } from 'lodash';
import BaseModel from './base';

const mapRelations = (objs, Model) => {
  if (isEmpty(objs)) return [];
  if (objs instanceof Model) return objs;

  if (isArray(objs)) {
    if (every(objs, (v) => v instanceof Model)) return objs;

    const ids = filter(uniq(map(objs, '_id')), obj => { return typeof obj !== 'undefined'; });
    const _return = [];
    ids.forEach((_id) => {
      const _model = new Model();
      _model.set({ _id });
      _model.fetch();
      _return.push(_model);
    });

    return _return;
  }

  const _model = new Model();
  _model.set({ _id: objs._id });
  _model.fetch();
  return _model;
};

export default BaseModel.extend({
  defaults: () => defaults(
    {
      _id: `patient_${shortid.generate()}`,
      type: 'patient',
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
      dateOfBirth: Date,
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
    }
  ],

  validate(attrs) {
    if (attrs.firstName === '') return 'firstName is required!';
    if (attrs.lastName === '') return 'lastName is required!';
  }
});
