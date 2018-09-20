import shortid from 'shortid';
import BaseModel from './base';

export default BaseModel.extend({
  idAttribute: '_id',
  defaults: () => {
    return {
      _id: `medicationHistory_${shortid.generate()}`,
      docType: 'medicationHistory',
      date: '',
      morning: false,
      lunch: false,
      evening: false,
      night: false,
      markedBy: '',
    };
  },

  validate: (attrs) => {
    const errors = [];
    if (attrs.date === '') errors.push('date is required!');
    if (errors.length) return errors;
  }
});
