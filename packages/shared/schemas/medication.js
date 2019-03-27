import defaults from './defaults';
import { MEDICATION_STATUSES } from '../constants';

export const MedicationSchema = {
  name: 'medication',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    patient: {
      type: 'string',
      optional: true,
    }, // Rel
    visit: {
      type: 'string',
      optional: true,
    }, // Rel
    drug: {
      type: 'drug',
    }, // Rel
    notes: {
      type: 'string',
      optional: true,
    },
    prescription: {
      type: 'string',
      optional: true,
    },
    prescriptionDate: {
      type: 'date',
      default: new Date(),
    },
    qtyMorning: {
      type: 'string',
      default: '0',
    },
    qtyLunch: {
      type: 'string',
      default: '0',
    },
    qtyEvening: {
      type: 'string',
      default: '0',
    },
    qtyNight: {
      type: 'string',
      default: '0',
    },
    refills: {
      type: 'string',
      optional: true,
    },
    endDate: {
      type: 'date',
      optional: true,
    },
    requestedDate: {
      type: 'date',
      default: new Date(),
    },
    requestedBy: {
      type: 'string',
      optional: true,
    },
    dispense: {
      type: 'bool',
      default: false,
    },
    status: {
      type: 'string',
      optional: true,
      default: MEDICATION_STATUSES.REQUESTED,
    },
    history: {
      type: 'list',
      objectType: 'medicationHistory',
    },
    ...defaults,
  },
};
