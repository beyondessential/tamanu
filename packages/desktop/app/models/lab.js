import { defaults } from 'lodash';
import BaseModel from './base';


export default BaseModel.extend({
  urlRoot:  `${BaseModel.prototype.urlRoot}/lab`,
  defaults: () => defaults({
      labDate: Date,
      notes: null,
      requestedBy: null,
      requestedDate: Date,
      result: null,
      status: null
    },
    BaseModel.prototype.defaults,
  ),
  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
