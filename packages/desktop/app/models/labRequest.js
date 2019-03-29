import Backbone from 'backbone-associations';
import moment from 'moment';
import BaseModel from './base';

import { LAB_REQUEST_STATUSES } from '../../../shared/constants';

import VisitModel from './visit';
import { register } from './register';

export default register('LabRequest', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/labRequest`,
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
      relatedModel: 'LabTest',
    }, {
      type: Backbone.One,
      key: 'category',
      relatedModel: 'LabTestCategory',
    },
    ...BaseModel.prototype.relations,
  ],

  getPatient() {
    const visit = this.getVisit();
    return visit && visit.getPatient();
  },

  getVisit() {
    const visit = this.attributes.visits[0];
    return visit && new VisitModel(visit);
  },
}));
