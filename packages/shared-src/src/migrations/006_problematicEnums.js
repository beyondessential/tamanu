const Sequelize = require('sequelize');

const ENCOUNTER_TYPES = [
  'admission',
  'clinic',
  'imaging',
  'emergency',
  'observation',
  'triage',
  'surveyResponse',
];

const DATA_ELEMENT_TYPES = [
  'FreeText',
  'Multiline',
  'Radio',
  'Select',
  'Date',
  'SubmissionDate',
  'Instruction',
  'Number',
  'Binary',
  'Checkbox',
  'CalculatedQuestion',
  'ConditionQuestion',
  'Arithmetic',
  'Condition',
  'Result',
  'SurveyLink',
  'SurveyAnswer',
  'SurveyResult',
  'Autocomplete',
  'Photo',
  'Geolocate',
  'DaysSince',
  'MonthsSince',
  'YearsSince',
  'Entity',
  'PrimaryEntity',
  'CodeGenerator',
];

module.exports = {
  up: async query => {
    await query.changeColumn('program_data_elements', 'type', {
      type: Sequelize.STRING(31),
      allowNull: false,
    });
    await query.changeColumn('encounters', 'encounter_type', {
      type: Sequelize.STRING(31),
      allowNull: false,
    });
  },

  down: async query => {
    await query.changeColumn('program_data_elements', 'type', {
      type: Sequelize.ENUM(DATA_ELEMENT_TYPES),
    });
    await query.changeColumn('encounters', 'encounter_type', {
      type: Sequelize.ENUM(ENCOUNTER_TYPES),
    });
  },
};
