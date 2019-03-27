import { defaults } from 'lodash';
import BaseModel from './base';
import { register } from './register';

export default register('LabTestCategory', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/labTestCategory`,
  defaults: () => defaults({
    name: null,
  },
  BaseModel.prototype.defaults),
}));
