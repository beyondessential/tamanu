import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.changeColumn('patient_issues', 'note', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: narrowing back to varchar(255) will fail if any note exceeds 255 characters.
  await query.changeColumn('patient_issues', 'note', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}
