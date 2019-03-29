import { defaults, isEmpty } from 'lodash';
import BaseModel from './base';
import { register } from './register';

export default register('ProcedureMedication', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/procedureMedication`,
  defaults: () => defaults({
    medication: '',
    quantity: '',
  }, BaseModel.prototype.defaults),

  validate: (attrs) => {
    const errors = [];
    if (!attrs.medication) errors.push('medication is required!');
    if (!attrs.quantity) errors.push('quantity is required!');
    if (!isEmpty(errors)) return errors;
  },
}));
