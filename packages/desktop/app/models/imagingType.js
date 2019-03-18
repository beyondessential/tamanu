import Backbone from 'backbone-associations';
import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/imagingType`,
  defaults: () => defaults({
    name: null,
    sortOrder: 0,
  },
  BaseModel.prototype.defaults),
});
