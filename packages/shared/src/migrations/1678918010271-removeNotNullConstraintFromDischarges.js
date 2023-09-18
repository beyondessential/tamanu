import { DataTypes } from 'sequelize';

export async function up(query) {
  // Given that the foreign key constraint is already added,
  // no need to put references in here. In some Sequelize versions
  // it breaks, in others it creates a duplicate foreign key.
  await query.changeColumn('discharges', 'discharger_id', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

export async function down(query) {
  await query.bulkDelete('discharges', { discharger_id: null });
  await query.changeColumn('discharges', 'discharger_id', {
    type: DataTypes.STRING,
    allowNull: false,
  });
}
