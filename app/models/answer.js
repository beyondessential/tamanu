import shortid from 'shortid';
import Backbone from 'backbone-associations';
import { defaults } from 'lodash';
import BaseModel from './base';
import mapRelations from '../utils/map-relations';

export default BaseModel.extend({
  url: `${BaseModel.prototype.url}/answer`,
  defaults: () => defaults({
      type: '',
      questionId: '',
      body: '',
    },
    BaseModel.prototype.defaults,
  ),
});
