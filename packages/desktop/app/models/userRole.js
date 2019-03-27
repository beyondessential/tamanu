import { defaults } from 'lodash';
import BaseModel from './base';
import { register } from './register';

export default register('UserRole', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/userRole`,
  defaults: () => defaults({
    name: null,
    capabilities: [],
    navRoute: null,
  }, BaseModel.prototype.defaults),

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
}));
