import shortid from 'shortid';
import Backbone from 'backbone-associations';
import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  defaults: () => defaults(
    {
      _id: `program_${shortid.generate()}`,
      docType: 'program',
      name: null,
      programType: 'direct',
    },
    BaseModel.prototype.defaults,
  ),

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
