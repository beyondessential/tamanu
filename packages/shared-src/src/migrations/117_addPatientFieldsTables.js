import Sequelize from 'sequelize';

const commonColumns = {
  id: {
    type: Sequelize.STRING,
    allowNull: false,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV4,
  },
  created_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
    allowNull: false,
  },
  updated_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
    allowNull: false,
  },
  deleted_at: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  marked_for_push: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  is_pushing: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  pushed_at: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  pulled_at: {
    type: Sequelize.DATE,
    allowNull: true,
  },
};

const tables = [
  [
    'patient_field_definition_categories',
    {
      ...commonColumns,
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    },
  ],
  [
    'patient_field_definitions',
    {
      ...commonColumns,
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      field_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      options: Sequelize.ARRAY(Sequelize.STRING),
      visibility_status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'current',
      },
      category_id: {
        type: Sequelize.STRING,
        references: {
          model: 'patient_field_definition_categories',
          key: 'id',
        },
        allowNull: false,
      },
    },
  ],
  [
    'patient_field_values',
    {
      ...commonColumns,
      value: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      definition_id: {
        type: Sequelize.STRING,
        references: {
          model: 'patient_field_definitions',
          key: 'id',
        },
        allowNull: false,
      },
      patient_id: {
        type: Sequelize.STRING,
        references: {
          model: 'patients',
          key: 'id',
        },
        allowNull: false,
      },
    },
  ],
];

export async function up(query) {
  for (const [name, def] of tables) {
    await query.createTable(name, def);
  }
  await query.addIndex('patient_field_values', {
    name: 'patient_field_values_patient_id',
    fields: ['patient_id'],
  });
  await query.addIndex('patient_field_values', {
    name: 'patient_field_values_definition_id',
    fields: ['definition_id'],
  });
  await query.addIndex('patient_field_values', {
    name: 'patient_field_values_updated_at',
    fields: ['updated_at'],
  });
}

export async function down(query) {
  await query.removeIndex('patient_field_values', 'patient_field_values_updated_at');
  await query.removeIndex('patient_field_values', 'patient_field_values_definition_id');
  await query.removeIndex('patient_field_values', 'patient_field_values_patient_id');
  for (const [name] of tables.slice().reverse()) {
    await query.dropTable(name);
  }
}
