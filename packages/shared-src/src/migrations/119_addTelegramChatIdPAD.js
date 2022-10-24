import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('patient_additional_data', 'telegram_chat_id', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('patient_additional_data', 'telegram_chat_id');
}
