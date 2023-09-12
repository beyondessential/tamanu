import { Op } from 'sequelize';

export async function up(query) {
  // Hard delete all soft deleted PatientBirthData so that we can add constraint so that only 
  // relationship between patient and patient birth data is 1:1
  await query.bulkDelete('patient_birth_data', { deleted_at: { [Op.not]: null } });
}

export async function down() {
  // no way to get the data back as data is hard deleted
}
