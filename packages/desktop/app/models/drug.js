import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${BaseModel.prototype.urlRoot}/drug`,
  defaults: () => defaults({
      name: '',
      code: '',
      unit: '',
    },
    BaseModel.prototype.defaults,
  ),
});
