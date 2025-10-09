import { DataTypes, Sequelize, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'dhis2_pushes', schema: 'logs' };

export async function up(query: QueryInterface) {
  await query.createTable(TABLE, {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    report_id: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    imported: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updated: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ignored: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    deleted: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    conflicts: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  });

  // Add foreign key constraint to report_definitions table in the public schema
  await query.addConstraint(TABLE, {
    fields: ['report_id'],
    type: 'foreign key',
    name: 'dhis2_pushes_report_id_fkey',
    references: {
      table: { tableName: 'report_definitions', schema: 'public' },
      field: 'id',
    },
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  });
}

export async function down(query: QueryInterface) {
  await query.removeConstraint(TABLE, 'dhis2_pushes_report_id_fkey');
  await query.dropTable(TABLE);
}
