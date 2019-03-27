import Backbone from 'backbone-associations';
import moment from 'moment';
import BaseModel from './base';
import { IMAGING_REQUEST_STATUSES } from '../constants';
import PatientModel from './patient';
import { register } from './register';

export default register('ImagingRequest', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/imagingRequest`,
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
      relatedModel: 'ImagingType',
    }, {
      type: Backbone.One,
      key: 'diagnosis',
      relatedModel: 'Diagnosis',
    }, {
      type: Backbone.One,
      key: 'requestedBy',
      relatedModel: 'User',
    }, {
      type: Backbone.One,
      key: 'reviewedBy',
      relatedModel: 'User',
    },
    ...BaseModel.prototype.relations,
  ],

  reverseRelations: [
    {
      type: Backbone.One,
      key: 'visit',
      model: require('./visit'),
    },
  ],

  getPatient() {
    const { parents: { visit: visitModel } } = this;
    const { parents: { patient: patientModel = new PatientModel() } } = visitModel;
    if (!patientModel.id) console.log(`patient not found for imagingRequest[${this.id}]`);
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
  },
}));
