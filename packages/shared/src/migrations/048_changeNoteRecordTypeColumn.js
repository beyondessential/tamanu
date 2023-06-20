const Sequelize = require('sequelize');

const NOTE_RECORD_TYPE_VALUES = [
  'Encounter',
  'Patient',
  'Triage',
  'PatientCarePlan',
  'LabRequest',
  'ImagingRequest',
];

module.exports = {
  up: async query => {
    await query.changeColumn('notes', 'record_type', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: async query => {
    await query.sequelize.query('DROP TYPE "enum_notes_record_type"');
    await query.changeColumn('notes', 'record_type', {
      type: Sequelize.ENUM(NOTE_RECORD_TYPE_VALUES),
      allowNull: false,
    });
  },
};
