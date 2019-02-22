import Backbone from 'backbone-associations';
import BaseModel from './base';
import shortid from 'shortid';

export default BaseModel.extend({
  urlRoot:  `${BaseModel.prototype.urlRoot}/labTest`,
  defaults: () => ({
    _id: shortid.generate(),
    type: null,
    result: null,
    ...BaseModel.prototype.defaults
  }),

  // Associations
  relations: [
    {
      type: Backbone.One,
      key: 'type',
      relatedModel: () => require('./labTestType'),
    },
    ...BaseModel.prototype.relations
  ],
});