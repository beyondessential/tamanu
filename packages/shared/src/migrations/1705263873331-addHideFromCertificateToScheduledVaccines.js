import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('scheduled_vaccines', 'hide_from_certificate', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
}

export async function down(query) {
  await query.removeColumn('scheduled_vaccines', 'hide_from_certificate');
}
