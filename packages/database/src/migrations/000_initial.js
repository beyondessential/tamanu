const Sequelize = require('sequelize');
const Utils = require('sequelize/lib/utils');

// ===
// some utility functions that mean I can just copypaste model
// definitions over rather than changing table and field names by hand
const underscoreObject = (obj) => {
  const translated = {};
  Object.keys(obj).forEach((k) => {
    translated[Utils.underscore(k)] = obj[k];
  });
  return translated;
};

const makeTableName = (name) => {
  if (name.toLowerCase() === 'referencedata') return 'reference_data';
  const underscored = Utils.pluralize(Utils.underscore(name));
  return underscored.replace(/^_/, '');
};

const foreignKey = (table) => ({
  type: Sequelize.STRING,
  references: {
    model: makeTableName(table),
    key: 'id',
  },
});

const BASE_FIELDS = {
  id: {
    type: Sequelize.STRING,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  createdAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
  updatedAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
  deletedAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
};
// =/=

const modelsPromises = [
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
].map(async (k) => {
  // eslint-disable-next-line global-require
  const module = await import(`./000_initial/${k}`).then((m) => m.default);
  const { fields, options } = module({ Sequelize, foreignKey });
  return {
    name: makeTableName(k),
    fields: {
      ...underscoreObject(BASE_FIELDS),
      ...underscoreObject(fields),
    },
    options,
  };
});

export default {
  up: async (query) => {
    await query.sequelize.transaction(async (transaction) => {
      const models = await Promise.all(modelsPromises);
      for (const t of await Promise.all(models)) {
        await query.createTable(t.name, t.fields, t.options, { transaction });
      }
    });
  },
  down: async (query) => {
    await query.sequelize.transaction(async (transaction) => {
      const models = await Promise.all(modelsPromises);
      const reversed = [...models].reverse();
      for (const t of reversed) {
        await query.dropTable(t.name, { transaction });
      }
    });
  },
};
