import { defaults } from 'lodash';
import Backbone from 'backbone-associations';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${BaseModel.prototype.urlRoot}/question`,
  defaults: () => defaults({
      text: null,
      indicator: null,
      imageData: null,
      type: null,
      options: [],
      code: null,
      details: null,
      params: [],
    },
    BaseModel.prototype.defaults,
  ),

  relations: [
    {
      type: Backbone.One,
      key: 'surveyGroupId',
      relatedModel: require('./surveyGroup'),
      // map: (values) => mapRelations(values, require('./surveyGroup')),
      // serialize: '_id'
    }
  ],

  isHeader() {
    return this.attributes.params.includes('header');
  },

  isSingleLine() {
    return this.attributes.params.includes('singleline');
  }
});
