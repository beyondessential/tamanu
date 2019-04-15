import Backbone from 'backbone-associations';
import { defaults } from 'lodash';
import moment from 'moment';
import { register } from './register';
import BaseModel from './base';
import PatientModel from './patient';
import { LAB_REQUEST_STATUSES, operativePlanStatuses } from '../constants';
import LabRequestsCollection from '../collections/labRequests';

export default register('Visit', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/visit`,
  defaults: () => defaults({
    dischargeInfo: '',
    startDate: moment(),
    endDate: null, // if visit type is outpatient, startDate and endDate are equal
    examiner: '',
    hasAppointment: false,
    location: '',
    outPatient: false,
    reasonForVisit: '',
    status: '',
    visitType: '',

    //  Relation fields
    medication: [],
    diagnoses: [],
    labRequests: [],
    imagingRequests: [],
    notes: [],
    procedures: [],
    vitals: [],
    reports: [],
    operationReports: [],
    operativePlans: [],
  }, BaseModel.prototype.defaults),

  // Associations
  relations: [
    {
      type: Backbone.Many,
      key: 'medication',
      relatedModel: 'Medication',
      serialize: '_id',
    }, {
      type: Backbone.Many,
      key: 'diagnoses',
      relatedModel: 'PatientDiagnosis',
      serialize: '_id',
    }, {
      type: Backbone.Many,
      key: 'labRequests',
      relatedModel: 'LabRequest',
      serialize: '_id',
    }, {
      type: Backbone.Many,
      key: 'imagingRequests',
      relatedModel: 'ImagingRequest',
      serialize: '_id',
    }, {
      type: Backbone.Many,
      key: 'notes',
      relatedModel: 'Note',
      serialize: '_id',
    }, {
      type: Backbone.Many,
      key: 'procedures',
      relatedModel: 'Procedure',
      serialize: '_id',
    }, {
      type: Backbone.Many,
      key: 'vitals',
      relatedModel: 'Vitals',
      serialize: '_id',
    }, {
      type: Backbone.Many,
      key: 'reports',
      relatedModel: 'Report',
      serialize: '_id',
    }, {
      type: Backbone.Many,
      key: 'operationReports',
      relatedModel: 'OperationReport',
      serialize: '_id',
    }, {
      type: Backbone.Many,
      key: 'operativePlans',
      relatedModel: 'OperativePlan',
      serialize: '_id',
    },
    ...BaseModel.prototype.relations,
  ],

  reverseRelations: [
    {
      type: Backbone.One,
      key: 'patient',
      model: 'Patient',
    },
  ],

  parse({ startDate, endDate, ...attributes }) {
    return {
      ...attributes,
      startDate: startDate ? moment(startDate) : startDate,
      endDate: endDate ? moment(endDate) : endDate,
    };
  },

  validate: (attrs) => {
    const errors = [];
    if (!moment(attrs.startDate).isValid()) errors.push('startDate is required!');
    if (attrs.visitType === '') errors.push('visitType is required!');
    return errors.length ? errors : null;
  },

  isCurrentVisit() {
    return this.get('visitType') === 'admission' && !this.get('endDate');
  },

  getPatient() {
    const [patient] = this.attributes.patient;
    return patient && new PatientModel(patient);
  },

  getLabRequests() {
    return new LabRequestsCollection(
      this.get('labRequests')
        .where({ status: LAB_REQUEST_STATUSES.VERIFIED })
        .filter(({ attributes: { tests } }) => (
          tests.some(test => test.attributes.result != null)
        )),
      { mode: 'client' },
    );
  },

  getCurrentOperativePlan() {
    return this.get('operativePlans').findWhere({ status: operativePlanStatuses.PLANNED });
  },

  getOperationReports() {
    return this.get('operationReports');
  },
}));
