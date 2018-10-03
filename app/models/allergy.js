import shortid from 'shortid';
import Backbone from 'backbone-associations';
import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  url: `${BaseModel.prototype.url}/allergy`,
  defaults: () => defaults({
    name: null,
    icd9CMCode: null,
    icd10Code: null,
  }, BaseModel.prototype.defaults),

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
