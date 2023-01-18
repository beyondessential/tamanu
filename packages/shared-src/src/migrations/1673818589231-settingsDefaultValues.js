import { DataTypes, Sequelize } from 'sequelize';

export async function up(query) {
  await query.sequelize.query(`ALTER TABLE settings ALTER COLUMN id TYPE uuid USING id::uuid`);
  await query.changeColumn('settings', 'id', {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    defaultValue: Sequelize.fn('uuid_generate_v4'),
  });

  await query.changeColumn('settings', 'created_at', {
    type: DataTypes.DATE,
    defaultValue: Sequelize.fn('current_timestamp', 3),
    allowNull: false,
  });
  await query.changeColumn('settings', 'updated_at', {
    type: DataTypes.DATE,
    defaultValue: Sequelize.fn('current_timestamp', 3),
    allowNull: false,
  });
}

export async function down(query) {
  await query.changeColumn('settings', 'id', {
    type: 'varchar(255)',
    allowNull: false,
    primaryKey: true,
  });

  await query.changeColumn('settings', 'created_at', {
    type: DataTypes.DATE,
  });
  await query.changeColumn('settings', 'updated_at', {
    type: DataTypes.DATE,
  });
}
