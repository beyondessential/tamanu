import Backbone from 'backbone-associations';
import { defaults } from 'lodash';
import moment from 'moment';
import BaseModel from './base';
import PatientModel from './patient';
import { LAB_REQUEST_STATUSES } from '../constants';
import LabRequestsCollection from '../collections/labRequests';

export default BaseModel.extend({
  urlRoot:  `${BaseModel.prototype.urlRoot}/visit`,
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
  }, BaseModel.prototype.defaults),

  // Associations
  relations: [
    {
      type: Backbone.Many,
      key: 'medication',
      relatedModel: () => require('./medication'),
      serialize: '_id',
    }, {
      type: Backbone.Many,
      key: 'diagnoses',
      relatedModel: () => require('./patientDiagnosis'),
      serialize: '_id',
    }, {
      type: Backbone.Many,
      key: 'labRequests',
      relatedModel: () => require('./labRequest'),
      serialize: '_id',
    }, {
      type: Backbone.Many,
      key: 'imagingRequests',
      relatedModel: () => require('./imagingRequest'),
      serialize: '_id',
    }, {
      type: Backbone.Many,
      key: 'notes',
      relatedModel: () => require('./note'),
      serialize: '_id',
    }, {
      type: Backbone.Many,
      key: 'procedures',
      relatedModel: () => require('./procedure'),
      serialize: '_id',
    }, {
      type: Backbone.Many,
      key: 'vitals',
      relatedModel: () => require('./vitals'),
      serialize: '_id',
    }, {
      type: Backbone.Many,
      key: 'reports',
      relatedModel: () => require('./report'),
      serialize: '_id',
    },
    ...BaseModel.prototype.relations
  ],

  reverseRelations: [
    {
      type: Backbone.One,
      key: 'patient',
      model: require('./patient'),
    }
  ],

  parse(res) {
    const _res = res
    if (res.startDate !== '') _res.startDate = moment(res.startDate);
    if (res.endDate !== null) _res.endDate = moment(res.endDate);
    return _res;
  },

  validate: (attrs) => {
    if (!moment(attrs.startDate).isValid()) return 'startDate is required!';
    if (attrs.visitType === '') return 'visitType is required!';
  },

  getPatient() {
    const patient = this.attributes.patient[0];
    return patient && new PatientModel(patient);
  },

  getLabRequests() {
    return new LabRequestsCollection(
      this.get('labRequests')
        .where({ status: LAB_REQUEST_STATUSES.VERIFIED })
        .filter(({ attributes: { tests } }) => (
          !!tests.find(test => test.attributes.result != null)
        ))
    , { mode: 'client' });
  },
});
