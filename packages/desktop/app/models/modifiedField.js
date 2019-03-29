import BaseModel from './base';
import { register } from './register';

export default register('ModifiedField', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/modifiedField`,
  defaults: () => ({
    token: null,
    field: null,
    time: null,
  }),
  relations: [],
}));
