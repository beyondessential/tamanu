import { defaults } from 'lodash';
import BaseModel from './base';
import { register } from './register';

export default register('Report', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/report`,
  defaults: () => defaults({
    reportDate: Date,
    reportType: null,
  }, BaseModel.prototype.defaults),

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
}));
