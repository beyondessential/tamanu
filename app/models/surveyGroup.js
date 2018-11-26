import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${process.env.LAN_REALM}/surveyGroup`,
  defaults: () => defaults({
      name: null,
    },
    BaseModel.prototype.defaults,
  )
});
