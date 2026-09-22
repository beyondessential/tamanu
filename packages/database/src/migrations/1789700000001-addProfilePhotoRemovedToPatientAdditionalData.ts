import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = 'patient_additional_data';
const COLUMN = 'profile_photo_removed';

export async function up(query: QueryInterface): Promise<void> {
  // Distinguishes a patient whose photo was deliberately removed from one who never had a photo
  // set on their record. Without it, removing the photo of a patient whose only photo is an
  // older ProfilePhoto survey answer would fall straight back to that answer.
  await query.addColumn(TABLE, COLUMN, {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn(TABLE, COLUMN);
}
