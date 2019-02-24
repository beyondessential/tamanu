import Backbone from 'backbone-associations';
import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${BaseModel.prototype.urlRoot}/lab`,
  defaults: () => defaults({
      name: null,
      category: null,
      femaleRange: null,
      maleRange: null,
      unit:  null,
      questionType: null,
      options: [],
      sortOrder: 0
    },
    BaseModel.prototype.defaults,
  ),

  // Associations
  relations: [
    {
      type: Backbone.One,
      key: 'category',
      relatedModel: () => require('./testCategory'),
    },
    ...BaseModel.prototype.relations
  ],
});