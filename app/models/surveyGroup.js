import shortid from 'shortid';
import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${process.env.LAN_REALM}/surveyGroup`,
  defaults: () => defaults({
      _id: shortid.generate(),
      name: null,
    },
    BaseModel.prototype.defaults,
  )
});
