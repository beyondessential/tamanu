import shortid from 'shortid';
import Backbone from 'backbone-associations';
import { defaults } from 'lodash';
import BaseModel from './base';


export default BaseModel.extend({
  urlRoot:  `${process.env.LAN_REALM}/lab`,
  defaults: () => defaults({
      // _id: shortid.generate(),
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
