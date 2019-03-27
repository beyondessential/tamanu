import { defaults } from 'lodash';
import BaseModel from './base';
import { register } from './register';

export default register('Answer', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/answer`,
  defaults: () => defaults({
    type: '',
    questionId: '',
    body: '',
  },
  BaseModel.prototype.defaults),
}));
