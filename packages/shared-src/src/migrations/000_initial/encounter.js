const ENCOUNTER_TYPES = {
  ADMISSION: 'admission',
  CLINIC: 'clinic',
  IMAGING: 'imaging',
  EMERGENCY: 'emergency',
  OBSERVATION: 'observation',
  TRIAGE: 'triage',
  SURVEY_RESPONSE: 'surveyResponse',
};

const ENCOUNTER_TYPE_VALUES = Object.values(ENCOUNTER_TYPES);

module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    encounterType: Sequelize.ENUM(ENCOUNTER_TYPE_VALUES),
    startDate: { type: Sequelize.DATE, allowNull: false },
    endDate: Sequelize.DATE,
    reasonForEncounter: Sequelize.TEXT,
    deviceId: Sequelize.TEXT,
    type: Sequelize.ENUM(['issue', 'warning']),
    patientId: foreignKey('Patient'),
    examinerId: foreignKey('User'),
    locationId: foreignKey('ReferenceData'),
    departmentId: foreignKey('ReferenceData'),
  },
});
