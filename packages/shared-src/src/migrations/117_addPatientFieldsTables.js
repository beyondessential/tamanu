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
      state: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'CURRENT',
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
}

export async function down(query) {
  for (const [name] of tables.slice().reverse()) {
    await query.dropTable(name);
  }
}
