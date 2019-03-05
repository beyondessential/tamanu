import Backbone from 'backbone-associations';
import BaseModel from './base';
import moment from 'moment';

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
    status: null,
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
    const { parents: { patient: patientModel } } = visitModel;
    return patientModel.toJSON();
  }
});