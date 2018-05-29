import Backbone from 'backbone-associations';
import shortid from 'shortid';
import moment from 'moment';
import { VisitModel } from './index';

export default Backbone.Model.extend({
  idAttribute: '_id',
  defaults: () => {
    const _id = shortid.generate();

    return {
      _id: `appointment_${_id}`,
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
    };
  },

  // Associations
  relations: [
    {
      type: Backbone.Many,
      key: 'visits',
      relatedModel: VisitModel
    }
  ],

  validate: (attrs) => {
    if (attrs.patient === '') return 'Patient is required!';
    if (!moment(attrs.startDate).isValid()) return 'startDate is required!';
    if (!moment(attrs.startDate).isValid()) return 'startDate is required!';
    if (!moment(attrs.endDate).isValid()) return 'endDate is required!';
    if (!moment(attrs.startDate).isBefore(attrs.endDate)) return 'Invalid start and end dates!';
  }
});
