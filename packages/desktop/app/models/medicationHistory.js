import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/medicationHistory`,
  defaults: () => defaults({
    date: '',
    morning: false,
    lunch: false,
    evening: false,
    night: false,
    markedBy: '',
  },
  BaseModel.prototype.defaults),

  validate: (attrs) => {
    const errors = [];
    if (attrs.date === '') errors.push('date is required!');
    if (errors.length) return errors;
  },
});
