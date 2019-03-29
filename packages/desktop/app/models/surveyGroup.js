import { defaults } from 'lodash';
import BaseModel from './base';
import { register } from './register';

export default register('SurveyGroup', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/surveyGroup`,
  defaults: () => defaults({
    name: null,
  },
  BaseModel.prototype.defaults),
}));
