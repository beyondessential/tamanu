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
    visits: [],
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
      relatedModel: () => require('./diagnosisList'),
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
      type: Backbone.Many,
      key: 'visits',
      model: require('./visit')
    }
  ],
});