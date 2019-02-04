import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${BaseModel.prototype.urlRoot}/modifiedField`,
  defaults: () => ({
    token: null,
    field: null,
    time: null,
  }),
  relations: []
});
