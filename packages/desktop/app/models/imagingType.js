import { defaults } from 'lodash';
import BaseModel from './base';
import { register } from './register';

export default register('ImagingType', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/imagingType`,
  defaults: () => defaults({
    name: null,
    sortOrder: 0,
  },
  BaseModel.prototype.defaults),
}));
