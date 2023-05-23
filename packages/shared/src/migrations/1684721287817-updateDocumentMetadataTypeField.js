import { QueryTypes, DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('document_metadata', 'source', {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'UPLOADED',
  });
}

export async function down(query) {
  await query.removeColumn('document_metadata', 'source');
}
