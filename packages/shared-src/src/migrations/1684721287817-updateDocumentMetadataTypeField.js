import { QueryTypes, DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('document_metadata', 'source', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await query.sequelize.query(`
    UPDATE document_metadata
    SET source = CASE 
      WHEN type = 'application/pdf' THEN 'RAW_PDF'
      WHEN type = 'image/jpeg' THEN 'RAW_JPEG'
      ELSE NULL
    END
  `);
}

export async function down(query) {
  await query.removeColumn('document_metadata', 'source');
}
