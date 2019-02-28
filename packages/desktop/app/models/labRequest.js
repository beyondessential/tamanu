import Backbone from 'backbone-associations';
import BaseModel from './base';
import moment from 'moment';

export default BaseModel.extend({
  urlRoot:  `${BaseModel.prototype.urlRoot}/labRequest`,
  defaults: () => ({
    date: moment(),
    requestedBy: null,
    requestedDate: moment(),
    category: null,
    status: null,
    tests: [],
    notes: null,
    patient: null,
    visit: null,
    ...BaseModel.prototype.defaults,
  }),

  // Associations
  relations: [
    {
      type: Backbone.Many, 
      key: 'tests',
      relatedModel: () => require('./labTest'),
    }, {
      type: Backbone.One,
      key: 'category',
      relatedModel: () => require('./labTestCategory'),
    }, {
      type: Backbone.One,
      key: 'patient',
      relatedModel: () => require('./patient'),
    }, {
      type: Backbone.One,
      key: 'visit',
      relatedModel: () => require('./visit'),
    },
    ...BaseModel.prototype.relations
  ],
});
