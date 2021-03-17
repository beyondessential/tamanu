const Sequelize = require('sequelize');
const Utils = require('sequelize/lib/utils');

const makeTableName = name => {
  if (name.toLowerCase() === 'referencedata') return 'reference_data';
  const underscored = Utils.pluralize(Utils.underscore(name));
  return underscored.replace(/^_/, '');
};

const tableNames = [
  'referenceData',
  'user',
  'patient',
  'patientAllergy',
  'patientCarePlan',
  'patientCondition',
  'patientFamilyHistory',
  'patientIssue',
  'encounter',
  'encounterDiagnosis',
  'encounterMedication',
  'procedure',
  'vitals',
  'triage',
  'referral',
  'referralDiagnosis',
  'scheduledVaccine',
  'administeredVaccine',
  'program',
  'programDataElement',
  'survey',
  'surveyScreenComponent',
  'surveyResponse',
  'surveyResponseAnswer',
  'labRequest',
  'labTestType',
  'labTest',
  'imagingRequest',
  'reportRequest',
  'patientCommunication',
  'setting',
  'syncMetadata',
  'note',
].map(m => makeTableName(m));

module.exports = {
  up: async query => {
    await query.sequelize.transaction(async transaction => {
      for (const table of tableNames) {
        await query.changeColumn(
          table,
          'created_at',
          {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            allowNull: false,
          },
          { transaction },
        );
        await query.changeColumn(
          table,
          'updated_at',
          {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            allowNull: false,
          },
          { transaction },
        );
      }
    });
  },
  down: async query => {
    await query.sequelize.transaction(async transaction => {
      for (const table of tableNames) {
        await query.changeColumn(
          table,
          'created_at',
          {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            allowNull: true,
          },
          { transaction },
        );
        await query.changeColumn(
          table,
          'updated_at',
          {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            allowNull: true,
          },
          { transaction },
        );
      }
    });
  },
};
