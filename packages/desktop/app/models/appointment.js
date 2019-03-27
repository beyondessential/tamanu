import Backbone from 'backbone-associations';
import moment from 'moment';
import { defaults } from 'lodash';
import BaseModel from './base';
import { register } from './register';

export default register('Appointment', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/appointment`,
  defaults: () => defaults({
      allDay: true,
      provider: '',
      location: '',
      appointmentType: 'admission',
      startDate: Date,
      endDate: Date,
      notes: '',
      status: 'scheduled',
      patient: '',
      visits: [],
    },
    BaseModel.prototype.defaults
  ),
  ignoreRequestKeys: ['patient'],

  // Associations
  relations: [
    {
      type: Backbone.Many,
      key: 'visits',
      relatedModel: 'Visit',
    },
    ...BaseModel.prototype.relations,
  ],

  reverseRelations: [
    {
      type: Backbone.Many,
      key: 'patients',
      model: require('./patient'),
    },
  ],

  validate(attrs) {
    if (!moment(attrs.startDate).isValid()) return 'startDate is required!';
    if (!moment(attrs.endDate).isValid()) return 'endDate is required!';
    if (!moment(attrs.startDate).isBefore(attrs.endDate)) return 'Invalid start and end dates!';
  },
}));
