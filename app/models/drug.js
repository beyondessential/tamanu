import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${process.env.LAN_REALM}/drug`,
  defaults: () => defaults({
      name: '',
      code: '',
      unit: '',
    },
    BaseModel.prototype.defaults,
  ),
});
