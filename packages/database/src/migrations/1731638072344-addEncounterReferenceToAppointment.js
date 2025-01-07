import { DataTypes } from 'sequelize';

export async function up(query) {
  query.addColumn('appointments', 'encounter_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'encounters',
      key: 'id',
    },
  });
}

export async function down(query) {
  query.removeColumn('appointments', 'encounter_id');
}
