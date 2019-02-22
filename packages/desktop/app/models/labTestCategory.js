import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${BaseModel.prototype.urlRoot}/labTestCategory`,
  defaults: () => defaults({
      name: null,
    },
    BaseModel.prototype.defaults,
  ),
});