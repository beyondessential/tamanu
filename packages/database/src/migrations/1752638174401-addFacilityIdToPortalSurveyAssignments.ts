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

  // Add index for facility_id to improve query performance
  await query.addIndex('portal_survey_assignments', ['facility_id'], {
    name: 'idx_portal_survey_assignments_facility_id',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeIndex('portal_survey_assignments', 'idx_portal_survey_assignments_facility_id');
  await query.removeColumn('portal_survey_assignments', 'facility_id');
}
