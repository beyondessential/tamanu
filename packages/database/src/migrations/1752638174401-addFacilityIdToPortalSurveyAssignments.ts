import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('portal_survey_assignments', 'facility_id', {
    type: DataTypes.TEXT,
    allowNull: false,
    references: {
      model: 'facilities',
      key: 'id',
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('portal_survey_assignments', 'facility_id');
}
