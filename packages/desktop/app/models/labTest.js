import Backbone from 'backbone-associations';
import BaseModel from './base';
import shortid from 'shortid';

export default BaseModel.extend({
  urlRoot:  `${BaseModel.prototype.urlRoot}/lab`,
  defaults: () => ({
    _id: shortid.generate(),
    test: null,
    result: null,
    ...BaseModel.prototype.defaults
  }),

  // Associations
  relations: [
    {
      type: Backbone.One,
      key: 'test',
      relatedModel: () => require('./test'),
    },
    ...BaseModel.prototype.relations
  ],
});