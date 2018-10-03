import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  url: `${BaseModel.prototype.url}/userRole`,
  defaults: () => defaults({
    name: null,
    capabilities: [],
    navRoute: null
  }, BaseModel.prototype.defaults),

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
