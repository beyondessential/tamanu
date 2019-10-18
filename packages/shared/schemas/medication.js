import defaults from './defaults';

export const MedicationSchema = {
  name: 'medication',
  primaryKey: '_id',
  properties: {
    _id: 'string',

    drug: 'drug',
    prescriber: 'user',

    prescription: 'string?',
    notes: 'string?',
    indication: 'string?',
    route: 'string',

    date: { type: 'date', default: new Date() },
    endDate: 'date?',

    qtyMorning: { type: 'float', default: 0 },
    qtyLunch: { type: 'float', default: 0 },
    qtyEvening: { type: 'float', default: 0 },
    qtyNight: { type: 'float', default: 0 },

    // reverse links
    visits: { type: 'linkingObjects', objectType: 'visit', property: 'medications' },

    ...defaults,
  },
};
