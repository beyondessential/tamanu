import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.addColumn('reference_drugs', 'is_sensitive', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
}

export async function down(query: QueryInterface) {
  await query.removeColumn('reference_drugs', 'is_sensitive');
} 