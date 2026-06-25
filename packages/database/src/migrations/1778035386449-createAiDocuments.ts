import { DataTypes, type QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('ai_documents', {
    id: {
      // ai documents use a generated id derived from (type, record_type, record_id)
      // so two facilities independently generating a summary for the same logical record
      type: `TEXT GENERATED ALWAYS AS ("type" || ';' || record_type || ';' || REPLACE("record_id", ';', ':')) STORED`,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    record_type: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    record_id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
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

  // unique constraint on the generated id so single-id lookups (e.g. PUT /:id) are
  // indexed; the composite primary key already enforces logical uniqueness.
  await query.sequelize.query(
    `ALTER TABLE ai_documents ADD CONSTRAINT ai_documents_id_key UNIQUE (id);`,
  );
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable('ai_documents');
}
