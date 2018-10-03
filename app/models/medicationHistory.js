import shortid from 'shortid';
import BaseModel from './base';

export default BaseModel.extend({
  url: `${BaseModel.prototype.url}/medicationHistory`,
  defaults: () => defaults({
      date: '',
      morning: false,
      lunch: false,
      evening: false,
      night: false,
      markedBy: '',
    },
    BaseModel.prototype.defaults,
  ),

  validate: (attrs) => {
    const errors = [];
    if (attrs.date === '') errors.push('date is required!');
    if (errors.length) return errors;
  }
});
