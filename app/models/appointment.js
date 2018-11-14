import Backbone from 'backbone-associations';
import shortid from 'shortid';
import moment from 'moment';
import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${process.env.LAN_REALM}/appointment`,
  defaults: () => defaults({
      // _id: shortid.generate(),
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
    BaseModel.prototype.defaults,
  ),

  // Associations
  relations: [
    {
      type: Backbone.Many,
      key: 'visits',
      relatedModel: () => require('./visit')
    }
  ],

  reverseRelations: [
    {
      key: 'patients',
      model: require('./patient')
    }
  ],

  validate(attrs) {
    if (!moment(attrs.startDate).isValid()) return 'startDate is required!';
    if (!moment(attrs.endDate).isValid()) return 'endDate is required!';
    if (!moment(attrs.startDate).isBefore(attrs.endDate)) return 'Invalid start and end dates!';
  }
});
