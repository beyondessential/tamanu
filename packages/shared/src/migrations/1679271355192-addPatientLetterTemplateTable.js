import Sequelize from 'sequelize';
import { VISIBILITY_STATUSES } from '../constants';

export async function up(query) {
  await query.createTable('patient_letter_templates', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    deleted_at: {
      type: Sequelize.DATE,
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('current_timestamp', 3),
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('current_timestamp', 3),
    },
    name: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    date_created: {
      type: 'date_string',
    },
    title: {
      type: Sequelize.TEXT,
    },
    body: {
      type: Sequelize.TEXT,
    },
    visibility_status: {
      type: Sequelize.STRING,
      defaultValue: VISIBILITY_STATUSES.CURRENT,
    },
    created_by_id: {
      type: Sequelize.STRING,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  });
}

export async function down(query) {
  await query.dropTable('patient_letter_templates');
}
