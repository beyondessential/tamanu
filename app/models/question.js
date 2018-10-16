import shortid from 'shortid';
import { defaults } from 'lodash';
import Backbone from 'backbone-associations';
import BaseModel from './base';
import mapRelations from '../utils/map-relations';

export default BaseModel.extend({
  urlRoot:  `${process.env.LAN_REALM}/question`,
  defaults: () => defaults({
      _id: shortid.generate(),
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
