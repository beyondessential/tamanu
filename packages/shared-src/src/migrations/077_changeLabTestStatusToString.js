import { STRING } from 'sequelize';

export async function up(query) {
  await query.changeColumn('lab_tests', 'status', {
    type: STRING(31),
    allowNull: false,
    defaultValue: 'reception_pending',
  });
}

export async function down() {
  // migration is irreversible
  // however, from the point of application code, it's safe to leave this column as a string
}
