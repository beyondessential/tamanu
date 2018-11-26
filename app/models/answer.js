import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${process.env.LAN_REALM}/answer`,
  defaults: () => defaults({
      type: '',
      questionId: '',
      body: '',
    },
    BaseModel.prototype.defaults,
  ),
});
