import shortid from 'shortid';
import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${process.env.LAN_REALM}/patientContact`,
  defaults: () => defaults({
      _id: shortid.generate(),
      name: '',
      phone: '',
      email: '',
      relationship: '',
    },
    BaseModel.prototype.defaults,
  ),

  validate: (attrs) => {
    const errors = [];
    if (attrs.name === '') errors.push('name is required!');
    if (attrs.phone === '') errors.push('phone is required!');
    if (errors.length) return errors;
  }
});
