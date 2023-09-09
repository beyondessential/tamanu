import { Op } from 'sequelize';

export async function up(query) {
  await query.bulkDelete('patient_birth_data', { deleted_at: { [Op.not]: null } });
}

export async function down() {
  // no way to get the data back
}
