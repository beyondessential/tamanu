import { defaults } from 'lodash';
import Backbone from 'backbone-associations';
import BaseModel from './base';
import { register } from './register';

export default register('Question', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/question`,
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
  BaseModel.prototype.defaults),

  relations: [
    {
      type: Backbone.One,
      key: 'surveyGroupId',
      relatedModel: 'SurveyGroup',
    },
    ...BaseModel.prototype.relations,
  ],

  isHeader() {
    return this.attributes.params.includes('header');
  },

  isSingleLine() {
    return this.attributes.params.includes('singleline');
  },
}));
