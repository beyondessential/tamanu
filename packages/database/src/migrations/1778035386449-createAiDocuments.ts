import { DataTypes, type QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('ai_documents', {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    summary_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    record_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    record_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'generated',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'ai',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await query.addIndex('ai_documents', ['record_type', 'record_id', 'summary_type'], {
    unique: true,
    name: 'ai_documents_record_type_record_id_summary_type_unique',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable('ai_documents');
}
