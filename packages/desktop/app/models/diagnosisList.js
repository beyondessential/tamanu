import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${BaseModel.prototype.urlRoot}/diagnosisList`,
  defaults: () => defaults({
      name: '',
      code: '',
    },
    BaseModel.prototype.defaults,
  ),
});
