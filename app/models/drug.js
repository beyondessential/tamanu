import shortid from 'shortid';
import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  url: `${BaseModel.prototype.url}/drug`,
  defaults: () => defaults({
      name: '',
      code: '',
      unit: '',
    },
    BaseModel.prototype.defaults,
  ),
});
