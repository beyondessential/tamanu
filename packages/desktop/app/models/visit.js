import Backbone from 'backbone-associations';
import { defaults } from 'lodash';
import moment from 'moment';
import BaseModel from './base';

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
    labs: [],
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
    }, {
      type: Backbone.Many,
      key: 'diagnoses',
      relatedModel: () => require('./diagnosis'),
    }, {
      type: Backbone.Many,
      key: 'labs',
      relatedModel: () => require('./lab'),
    }, {
      type: Backbone.Many,
      key: 'notes',
      relatedModel: () => require('./note'),
    }, {
      type: Backbone.Many,
      key: 'procedures',
      relatedModel: () => require('./procedure'),
    }, {
      type: Backbone.Many,
      key: 'vitals',
      relatedModel: () => require('./vitals'),
    }, {
      type: Backbone.Many,
      key: 'reports',
      relatedModel: () => require('./report'),
    },
    ...BaseModel.prototype.relations
  ],

  parse(res) {
    const _res = res
    if (res.startDate !== '') _res.startDate = moment(res.startDate);
    if (res.endDate !== null) _res.endDate = moment(res.endDate);
    return _res;
  },

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
