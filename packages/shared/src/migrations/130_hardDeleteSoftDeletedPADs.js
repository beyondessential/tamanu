import { Op } from 'sequelize';

export async function up(query) {
  // for the next migration, that expects only one PAD per patient, we hard delete any soft deleted
  // records as only the "live" record should be kept, and even if there is no duplicate currently,
  // having a soft deleted record for a patient would prevent recording any PAD against them
  await query.bulkDelete('patient_additional_data', { deleted_at: { [Op.not]: null } }); // this bit destructive, can't be downed
}

export async function down() {
  // no way to get the data back
}
