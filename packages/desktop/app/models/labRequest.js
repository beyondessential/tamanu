import Backbone from 'backbone-associations';
import BaseModel from './base';
import moment from 'moment';

import { LAB_REQUEST_STATUSES } from '../../../shared/constants';

import VisitModel from './visit';
import PatientModel from './patient';

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

  getPatient() {
    const visit = this.getVisit();
    return visit && visit.getPatient();
  },

  getVisit() {
    const visit = this.attributes.visits[0];
    return visit && new VisitModel(visit);
  },
});
