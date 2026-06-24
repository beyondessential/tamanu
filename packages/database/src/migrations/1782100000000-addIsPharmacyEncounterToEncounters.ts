import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('encounters', 'is_pharmacy_encounter', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: drops the column, so any encounters flagged as pharmacy walk-ins lose the flag on rollback
  await query.removeColumn('encounters', 'is_pharmacy_encounter');
}
