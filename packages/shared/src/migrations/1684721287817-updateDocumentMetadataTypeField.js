import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('document_metadata', 'source', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'uploaded',
  });
}

export async function down(query) {
  await query.removeColumn('document_metadata', 'source');
}
