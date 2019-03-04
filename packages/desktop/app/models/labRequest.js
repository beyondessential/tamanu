import Backbone from 'backbone-associations';
import BaseModel from './base';
import moment from 'moment';

import { LAB_REQUEST_STATUSES } from '../../../shared/constants';

export default BaseModel.extend({
  urlRoot:  `${BaseModel.prototype.urlRoot}/labRequest`,
  defaults: () => ({
    date: moment(),
    requestedBy: null,
    requestedDate: moment(),
    category: null,
    status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
    tests: [],
    notes: null,
    ...BaseModel.prototype.defaults,
  }),

  // Associations
  relations: [
    {
      type: Backbone.Many,
      key: 'tests',
      relatedModel: () => require('./labTest'),
    }, {
      type: Backbone.One,
      key: 'category',
      relatedModel: () => require('./labTestCategory'),
    },
    ...BaseModel.prototype.relations
  ],
});
