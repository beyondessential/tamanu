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
      // map: (values) => mapRelations(values, require('./medication')),
      // serialize: '_id'
    },
    {
      type: Backbone.Many,
      key: 'diagnoses',
      relatedModel: () => require('./diagnosis'),
      // map: (values) => mapRelations(values, require('./diagnosis')),
      // serialize: '_id'
    },
    {
      type: Backbone.Many,
      key: 'labs',
      relatedModel: () => require('./lab'),
      // map: (values) => mapRelations(values, require('./lab')),
      // serialize: '_id'
    },
    {
      type: Backbone.Many,
      key: 'notes',
      relatedModel: () => require('./note'),
      // map: (values) => mapRelations(values, require('./note')),
      // serialize: '_id'
    },
    {
      type: Backbone.Many,
      key: 'procedures',
      relatedModel: () => require('./procedure'),
      // map: (values) => mapRelations(values, require('./procedure')),
      // serialize: '_id'
    },
    {
      type: Backbone.Many,
      key: 'vitals',
      relatedModel: () => require('./vitals'),
      // map: (values) => mapRelations(values, require('./vitals')),
      // serialize: '_id'
    },
    {
      type: Backbone.Many,
      key: 'reports',
      relatedModel: () => require('./report'),
      // map: (values) => mapRelations(values, require('./report')),
      // serialize: '_id',
    },
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
