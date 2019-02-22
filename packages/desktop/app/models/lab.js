import Backbone from 'backbone-associations';
import BaseModel from './base';
import moment from 'moment';
import { store } from '../store';

export default BaseModel.extend({
  initialize() {
    const { auth: { userId } } = store.getState();
    const UserModel = require('./user');
    this.set('requestedBy', new UserModel({ _id: userId }), { silent: true });
  },
  urlRoot:  `${BaseModel.prototype.urlRoot}/lab`,
  defaults: () => ({
    date: moment(),
    requestedBy: null,
    requestedDate: moment(),
    category: null,
    status: null,
    tests: [],
    notes: null,
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
      relatedModel: () => require('./testCategory'),
    },
    ...BaseModel.prototype.relations
  ],
});