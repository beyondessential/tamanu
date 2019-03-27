import { defaults } from 'lodash';
import BaseModel from './base';
import { register } from './register';

export default register('Drug', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/drug`,
  defaults: () => defaults({
    name: '',
    code: '',
    unit: '',
  },
  BaseModel.prototype.defaults),
}));
