import { type QueryInterface, DataTypes } from 'sequelize';

const TABLE = 'certificate_notifications';
const COLUMN = 'require_signing';

export async function up(query: QueryInterface): Promise<void> {
  await query.removeColumn(TABLE, COLUMN);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.addColumn(TABLE, COLUMN, {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  });
}
