import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

export async function up(query: QueryInterface) {
    await query.createTable('reference_drug_facility', {
      id: {
        type: `TEXT GENERATED ALWAYS AS (REPLACE("reference_drug_id"::TEXT, ';', ':') || ';' || REPLACE("facility_id", ';', ':')) STORED`,
      },
      reference_drug_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'reference_drugs',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      facility_id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'facilities',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      quantity: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Stock level (number as string), "unavailable", or NULL for unknown',
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.fn('now'),
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.fn('now'),
        allowNull: false,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      updated_at_sync_tick: {
        type: DataTypes.BIGINT,
        defaultValue: -999,
        allowNull: false,
      },
    });
}

export async function down(query: QueryInterface) {
  await query.dropTable('reference_drug_facility');
}

