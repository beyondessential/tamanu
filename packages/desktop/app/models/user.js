import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/user`,
  defaults: () => defaults({
    derived_key: null,
    deleted: false,
    displayName: null,
    email: null,
    iterations: '',
    name: null,
    password: null,
    password_scheme: null,
    password_sha: null,
    rev: null,
    roles: [],
    salt: null,
    userPrefix: null,
  }, BaseModel.prototype.defaults),

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
