import { defaults } from 'lodash';
import Backbone from 'backbone-associations';
import BaseModel from './base';
import { register } from './register';

export default register('Program', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/program`,
  defaults: () => defaults({
    name: null,
    programType: 'direct',
    surveys: [],
  },
  BaseModel.prototype.defaults),

  // Associations
  relations: [
    {
      type: Backbone.Many,
      key: 'surveys',
      relatedModel: () => require('./survey'),
      collectionType: require('../collections/surveys'),
    },
    ...BaseModel.prototype.relations,
  ],

  getSurvey(surveyId) {
    const { surveys } = this.attributes;
    return surveys.models.find(model => model.id === surveyId);
  },
}));
