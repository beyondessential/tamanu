import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable(
    { schema: 'logs', tableName: 'changes' },
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.fn('gen_random_uuid'),
      },
      table_oid: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      table_schema: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      table_name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      logged_at: {
        type: DataTypes.TIMESTAMP,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.TIMESTAMP,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.TIMESTAMP,
        allowNull: false,
      },
      deleted_at: {
        type: DataTypes.TIMESTAMP,
        allowNull: true,
      },
      updated_at_sync_tick: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      updated_by_user_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: { schema: 'public', tableName: 'users' },
          key: 'id',
        },
      },
      record_id: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      record_update: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      record_data: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
    },
  );
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable({ schema: 'logs', tableName: 'changes' });
}
