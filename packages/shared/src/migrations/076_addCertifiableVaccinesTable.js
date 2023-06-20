import { STRING, DATE, NOW, INTEGER, UUIDV4 } from 'sequelize';

export async function up(query) {
  await query.createTable('certifiable_vaccines', {
    id: {
      type: STRING,
      defaultValue: UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    created_at: {
      type: DATE,
      defaultValue: NOW,
      allowNull: false,
    },
    updated_at: {
      type: DATE,
      defaultValue: NOW,
      allowNull: false,
    },
    deleted_at: {
      type: DATE,
      allowNull: true,
    },
    vaccine_id: {
      type: STRING,
      allowNull: false,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    },
    manufacturer_id: {
      type: STRING,
      allowNull: true,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    },
    icd11_drug_code: {
      type: STRING,
      allowNull: false,
    },
    icd11_disease_code: {
      type: STRING,
      allowNull: false,
    },
    atc_code: {
      type: STRING,
      allowNull: false,
    },
    target_snomed_code: {
      type: STRING,
      allowNull: true,
    },
    eu_product_code: {
      type: STRING,
      allowNull: true,
    },
    maximum_dosage: {
      type: INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
  });

  await query.addConstraint('certifiable_vaccines', {
    type: 'unique',
    name: 'certifiable_vaccines_unique_vaccine_id',
    fields: ['vaccine_id'],
  });
}

export async function down(query) {
  await query.removeConstraint('certifiable_vaccines', 'certifiable_vaccines_unique_vaccine_id');
  await query.dropTable('certifiable_vaccines');
}
