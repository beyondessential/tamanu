import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('administered_vaccines', 'given_overseas', {
    type: DataTypes.BOOLEAN,
  });
}

export async function down(query) {
  await query.removeColumn('administered_vaccines', 'given_overseas');
}
