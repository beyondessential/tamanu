import { STRING, DATE, BOOLEAN, NOW, UUIDV4 } from 'sequelize';

const basics = {
  id: {
    type: STRING,
    defaultValue: UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  created_at: {
    type: DATE,
    defaultValue: NOW,
  },
  updated_at: {
    type: DATE,
    defaultValue: NOW,
  },
  deleted_at: {
    type: DATE,
    defaultValue: NOW,
  },
};

const syncColumns = {
  marked_for_push: {
    type: BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  is_pushing: {
    type: BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  pushed_at: {
    type: DATE,
    allowNull: true,
  },
  pulled_at: {
    type: DATE,
    allowNull: true,
  },
};

export async function up(query) {
  await query.createTable('recent_patients', {
    ...basics,
    ...syncColumns,
    user_id: {
      type: STRING,
      references: { model: 'users', key: 'id' },
      allowNull: false,
    },
    patient_id: {
      type: STRING,
      references: { model: 'patients', key: 'id' },
      allowNull: false,
    },
  });
}

export async function down(query) {
  await query.dropTable('recent_patients');
}
