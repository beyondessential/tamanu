import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

const TABLE_NAME = 'medication_dispenses';
const ISO9075_DATE_TIME_FMT = 'YYYY-MM-DD HH24:MI:SS';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable(TABLE_NAME, {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: Sequelize.fn('gen_random_uuid'),
    },
    pharmacy_order_prescription_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'pharmacy_order_prescriptions',
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    dispensed_by_user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    dispensed_at: {
      type: DataTypes.DATETIMESTRING,
      allowNull: false,
      defaultValue: Sequelize.fn(
        'to_char',
        Sequelize.fn('current_timestamp', 3),
        ISO9075_DATE_TIME_FMT,
      ),
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await query.addIndex(TABLE_NAME, ['pharmacy_order_prescription_id'], {
    name: 'idx_medication_dispenses_pharmacy_order_prescription_id',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable(TABLE_NAME);
}
