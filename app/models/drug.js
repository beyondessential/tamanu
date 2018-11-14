import shortid from 'shortid';
import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${process.env.LAN_REALM}/drug`,
  defaults: () => defaults({
      // _id: shortid.generate(),
      name: '',
      code: '',
      unit: '',
    },
    BaseModel.prototype.defaults,
  ),
});
