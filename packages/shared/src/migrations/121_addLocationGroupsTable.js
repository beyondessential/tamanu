import Sequelize from 'sequelize';
import { VISIBILITY_STATUSES } from '@tamanu/constants';

const syncColumns = {
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

export async function up(query) {
  await query.createTable('location_groups', {
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
    visibility_status: {
      type: Sequelize.TEXT,
      defaultValue: VISIBILITY_STATUSES.CURRENT,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    code: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    facility_id: {
      type: Sequelize.STRING,
      allowNull: false,
      references: {
        model: 'facilities',
        key: 'id',
      },
    },
    ...syncColumns,
  });

  await query.addColumn('locations', 'location_group_id', {
    type: Sequelize.STRING,
    allowNull: true,
    default: null,
    references: {
      model: 'location_groups',
      key: 'id',
    },
  });
}

export async function down(query) {
  await query.removeColumn('locations', 'location_group_id');
  await query.dropTable('location_groups');
}
