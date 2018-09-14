import shortid from 'shortid';
import { defaults, isEmpty } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  defaults: () => defaults({
    _id: `procedureMedication_${shortid.generate()}`,
    docType: 'procedureMedication',
    medication: '',
    quantity: '',
  }, BaseModel.prototype.defaults),

  validate: (attrs) => {
    const errors = [];
    if (!attrs.medication) errors.push('medication is required!');
    if (!attrs.quantity) errors.push('quantity is required!');
    if (!isEmpty(errors)) return errors;
  }
});
