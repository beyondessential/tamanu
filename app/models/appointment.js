import Backbone from 'backbone-associations';
import shortid from 'shortid';
import moment from 'moment';
import { defaults } from 'lodash';
import BaseModel from './base';
import { VisitModel } from './index';

export default BaseModel.extend({
  url: `${BaseModel.prototype.url}/appointment`,
  defaults: () => defaults({
      allDay: true,
      provider: '',
      location: '',
      appointmentType: '',
      startDate: Date,
      endDate: Date,
      notes: '',
      status: 'Scheduled',
      patient: '',
      visits: [],
    },
    BaseModel.prototype.defaults,
  ),

  // Associations
  relations: [
    {
      type: Backbone.Many,
      key: 'visits',
      relatedModel: VisitModel
    }
  ],

  validate(attrs) {
    if (attrs.patient === '') return 'Patient is required!';
    if (!moment(attrs.startDate).isValid()) return 'startDate is required!';
    if (!moment(attrs.endDate).isValid()) return 'endDate is required!';
    if (!moment(attrs.startDate).isBefore(attrs.endDate)) return 'Invalid start and end dates!';
  }
});
