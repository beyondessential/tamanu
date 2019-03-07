import Backbone from 'backbone-associations';
import BaseModel from './base';
import moment from 'moment';
import { IMAGING_REQUEST_STATUSES } from '../constants';
import PatientModel from './patient';

export default BaseModel.extend({
  urlRoot:  `${BaseModel.prototype.urlRoot}/imagingRequest`,
  defaults: () => ({
    date: moment(),
    type: null,
    detail: null,
    location: null,
    diagnosis: null,
    notes: null,
    imageSource: null,
    status: IMAGING_REQUEST_STATUSES.PENDING,
    requestedBy: null,
    requestedDate: moment(),
    reviewedBy: null,
    reviewedDate: moment(),
    ...BaseModel.prototype.defaults,
  }),
  ignoreRequestKeys: ['visits'],

  // Associations
  relations: [
    {
      type: Backbone.One,
      key: 'type',
      relatedModel: () => require('./imagingType'),
    }, {
      type: Backbone.One,
      key: 'diagnosis',
      relatedModel: () => require('./diagnosis'),
    }, {
      type: Backbone.One,
      key: 'requestedBy',
      relatedModel: () => require('./user'),
    }, {
      type: Backbone.One,
      key: 'reviewedBy',
      relatedModel: () => require('./user'),
    },
    ...BaseModel.prototype.relations
  ],

  reverseRelations: [
    {
      type: Backbone.One,
      key: 'visit',
      model: require('./visit')
    }
  ],

  getPatient() {
    const { parents: { visit: visitModel } } = this;
    const { parents: { patient: patientModel = new PatientModel() } } = visitModel;
    return patientModel.toJSON();
  },

  validate(attributes) {
    const errors = [];
    if (!attributes.type) errors.push('type is required');
    if (attributes._id) {
      if (!attributes.diagnosis) errors.push('diagnosis is required');
      if (!attributes.detail) errors.push('detail is required');
    }
    if (errors.length >= 1) return errors;
  }
});