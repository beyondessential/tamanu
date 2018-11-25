import shortid from 'shortid';
import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${process.env.LAN_REALM}/answer`,
  defaults: () => defaults({
      _id: shortid.generate(),
      type: '',
      questionId: '',
      body: '',
    },
    BaseModel.prototype.defaults,
  ),
});
