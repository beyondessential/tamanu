import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = 'patient_additional_data';
const COLUMN = 'profile_photo_attachment_id';

export async function up(query: QueryInterface): Promise<void> {
  // Holds the id of the attachment storing the patient's profile photo. Deliberately not a
  // foreign key: attachments live on the central server and are never pulled down to facility
  // servers, so the referenced row won't exist locally.
  await query.addColumn(TABLE, COLUMN, {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn(TABLE, COLUMN);
}
