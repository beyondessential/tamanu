import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  url: `${BaseModel.prototype.url}/report`,
  defaults: () => defaults({
    reportDate: Date,
    reportType: null,
  }, BaseModel.prototype.defaults),

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
