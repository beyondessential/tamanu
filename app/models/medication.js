const moment = require('moment');

const MedicationSchema = {
  name: 'medication',
  properties: {
    patient: {         type: 'string',         optional: true       }, // Rel
    visit: {         type: 'string',         optional: true       }, // Rel
    drug: {         type: 'string',         optional: true       }, // Rel
    notes: {         type: 'string',         optional: true       },
    prescription: {         type: 'string',         optional: true       },
    prescriptionDate: {
      type: 'date',
      default: moment()
    },
    qtyMorning: {
      type: 'int',
      default: 0
    },
    qtyLunch: {
      type: 'int',
      default: 0
    },
    qtyEvening: {
      type: 'int',
      default: 0
    },
    qtyNight: {
      type: 'int',
      default: 0
    },
    refills: {         type: 'string',         optional: true       },
    endDate: 'date',
    requestedDate: {
      type: 'date',
      default: moment()
    },
    requestedBy: {         type: 'string',         optional: true       },
    status: {         type: 'string',         optional: true       },
    history: {
      type: 'list',
      objectType: 'medicationHistory'
    },
  }
};

module.exports = MedicationSchema;
