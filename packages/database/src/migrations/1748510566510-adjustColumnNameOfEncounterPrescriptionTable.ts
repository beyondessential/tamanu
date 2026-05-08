import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.renameColumn('encounter_prescriptions', 'is_discharge', 'is_selected_for_discharge');
}

export async function down(query: QueryInterface): Promise<void> {
  await query.renameColumn('encounter_prescriptions', 'is_selected_for_discharge', 'is_discharge');
}
