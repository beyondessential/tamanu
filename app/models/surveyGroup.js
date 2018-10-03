import shortid from 'shortid';
import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  url: `${BaseModel.prototype.url}/surveyGroup`,
  defaults: () => defaults({
      name: null,
    },
    BaseModel.prototype.defaults,
  )
});
