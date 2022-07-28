import { QueryInterface } from 'sequelize';

const REFERENCE_DATA_TABLE_NAME = 'reference_data';

const imagingTypeReferenceIds = [
  'imagingType-X-Ray',
  'imagingType-CT-Scan',
  'imagingType-Ultrasound',
  'imagingType-Mammogram',
  'imagingType-Echocardiogram',
  'imagingType-Endoscopy',
];

export async function up(query: QueryInterface) {
  await query.bulkDelete(REFERENCE_DATA_TABLE_NAME, { id: imagingTypeReferenceIds });
}

export async function down() {
  // This is a destructive migration, so can't revert it
}
