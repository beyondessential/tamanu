import Backbone from 'backbone-associations';
import shortid from 'shortid';
import moment from 'moment';
import { extend } from 'lodash';
import BaseModel from './base';
import { VisitModel } from './index';

export default BaseModel.extend({
  defaults: () => extend(
    BaseModel.prototype.defaults,
    {
      _id: `appointment_${shortid.generate()}`,
      type: 'appointment',
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
    }
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
    if (!moment(attrs.startDate).isValid()) return 'startDate is required!';
    if (!moment(attrs.endDate).isValid()) return 'endDate is required!';
    if (!moment(attrs.startDate).isBefore(attrs.endDate)) return 'Invalid start and end dates!';
  }
});
