import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${BaseModel.prototype.urlRoot}/lab`,
  defaults: () => defaults({
      name: null,
    },
    BaseModel.prototype.defaults,
  ),
});