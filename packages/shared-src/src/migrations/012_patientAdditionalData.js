const Sequelize = require('sequelize');

const reference = {
  type: Sequelize.STRING,
  references: {
    model: 'reference_data',
    key: 'id',
  },
};

const movedFields = {
  blood_type: Sequelize.STRING,
  title: Sequelize.STRING,
  ethnicity_id: reference,
  nationality_id: reference,
  country_id: reference,
  division_id: reference,
  subdivision_id: reference,
  medical_area_id: reference,
  nursing_zone_id: reference,
  settlement_id: reference,
  occupation_id: reference,
};

const newFields = {
  place_of_birth: Sequelize.STRING,
  primary_contact_number: Sequelize.STRING,
  secondary_contact_number: Sequelize.STRING,
  marital_status: Sequelize.STRING,
  city_town: Sequelize.STRING,
  street_village: Sequelize.STRING,
  educational_level: Sequelize.STRING,
  social_media: Sequelize.STRING,
};

const basics = {
  id: {
    type: Sequelize.STRING,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  created_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
  updated_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
  deleted_at: {
    type: Sequelize.DATE,
  },
};

const movedFieldNames = Object.keys(movedFields);

module.exports = {
  up: query =>
    query.sequelize.transaction(async () => {
      // create PAD table
      await query.createTable('patient_additional_data', {
        ...basics,
        ...newFields,
        ...movedFields,
        patient_id: {
          type: Sequelize.STRING,
          references: {
            model: 'patients',
            key: 'id',
          },
        },
      });

      // create a PAD record for every patient
      const queryFields = movedFieldNames.join(', ');
      await query.sequelize.query(`
      INSERT INTO patient_additional_data 
          (id, ${queryFields}, patient_id)
        SELECT
          id,
          ${movedFieldNames.join(', ')},
          id AS patient_id
        FROM patients;
    `);

      // remove PAD columns in patient table
      for (const fieldName of Object.keys(movedFields)) {
        await query.removeColumn('patients', fieldName);
      }
    }),

  down: query =>
    query.sequelize.transaction(async () => {
      // create PAD columns in patient table
      for (const [fieldName, fieldType] of Object.entries(movedFields)) {
        await query.addColumn('patients', fieldName, fieldType);
      }

      // merge existing PAD columns back into patient records
      await query.sequelize.query(`
      UPDATE patients
        SET 
          ${movedFieldNames.map(fn => `${fn} = pad.${fn}`).join(', ')}
        FROM patient_additional_data pad
        WHERE pad.patient_id = patients.id;
    `);

      // delete PAD table
      await query.dropTable('patient_additional_data');
    }),
};
