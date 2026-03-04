import { DataTypes, QueryInterface } from 'sequelize';

const tableName = 'user_leaves';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable(tableName, {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    start_date: {
      type: DataTypes.DATESTRING,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATESTRING,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    scheduled_by: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    scheduled_at: {
      type: DataTypes.DATETIMESTRING,
      allowNull: false,
    },
    removed_by: {
      type: DataTypes.STRING,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    removed_at: {
      type: DataTypes.DATETIMESTRING,
      allowNull: true,
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
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable(tableName);
}
