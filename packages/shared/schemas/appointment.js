import defaults from './defaults';
import { APPOINTMENT_STATUSES } from '../constants';

export const AppointmentSchema = {
  name: 'appointment',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    location: 'location?',
    practitioner: 'user?',
    date: 'date',

    endDate: 'date?',
    status: {
      type: 'string',
      default: APPOINTMENT_STATUSES.SCHEDULED,
    },

    patients: { type: 'linkingObjects', objectType: 'patient', property: 'appointments' },
    ...defaults,
  },
};
