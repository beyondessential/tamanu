import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.createTable('do_it', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
  });
}

export async function down(query) {
  await query.dropTable('do_it');
}