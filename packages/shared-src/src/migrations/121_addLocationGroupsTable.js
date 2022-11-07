import Sequelize from 'sequelize';

export async function up(query) {
  await query.createTable('location_groups', {
    id: {
      type: Sequelize.UUID,
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
  });

  await query.addColumn('locations', 'location_group_id', {
    type: Sequelize.STRING,
    allowNull: true,
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
