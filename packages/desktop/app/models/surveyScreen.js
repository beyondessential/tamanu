import { defaults } from 'lodash';
import Backbone from 'backbone-associations';
import BaseModel from './base';
import { register } from './register';

export default register('SurveyScreen', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/surveyScreen`,
  defaults: () => defaults({
    surveyId: null,
    screenNumber: null,
    components: [],
  },
  BaseModel.prototype.defaults),

  relations: [
    {
      type: Backbone.Many,
      key: 'components',
      relatedModel: 'SurveyScreenComponent',
    },
    ...BaseModel.prototype.relations,
  ],
}));
