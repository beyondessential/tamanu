import shortid from 'shortid';
import { defaults } from 'lodash';
import Backbone from 'backbone-associations';
import BaseModel from './base';
import mapRelations from '../utils/map-relations';

export default BaseModel.extend({
  url: `${BaseModel.prototype.url}/question`,
  defaults: () => defaults({
      test: null,
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
      map: (values) => mapRelations(values, require('./surveyGroup')),
      serialize: '_id'
    }
  ],

  isHeader() {
    return this.attributes.params.includes('header');
  },

  isSingleLine() {
    return this.attributes.params.includes('singleline');
  }
});
