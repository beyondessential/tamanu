import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${BaseModel.prototype.urlRoot}/answer`,
  defaults: () => defaults({
      type: '',
      questionId: '',
      body: '',
    },
    BaseModel.prototype.defaults,
  ),
});
