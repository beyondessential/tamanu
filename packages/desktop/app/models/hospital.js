import Backbone from 'backbone-associations';
import { defaults } from 'lodash';
import BaseModel from './base';
import { store } from '../store';

export default BaseModel.extend({
  initialize() {
    const { auth } = store.getState();
    const { hospitalId } = auth;
    this.set('_id', hospitalId, { silent: true });
  },
  urlRoot:  `${BaseModel.prototype.urlRoot}/hospital`,
  defaults: () => defaults({
    name: null,
    key: null,
    users: [],
    objectsFullySynced: [],
  }, BaseModel.prototype.defaults),
  // Associations
  relations: [
    {
      type: Backbone.Many,
      key: 'users',
      relatedModel: () => require('./user'),
    },
    ...BaseModel.prototype.relations
  ]
});
