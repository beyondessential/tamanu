const BaseModel = require('./base');
const shortid = require('shortid');

export default BaseModel.extend({
  url: `${BaseModel.prototype.url}/lab`,
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
