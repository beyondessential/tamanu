import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

const ENCOUNTER_SYNDROMES = 'encounter_syndromes';
const ENCOUNTER_SYNDROME_ITEMS = 'encounter_syndrome_items';

const baseFields = {
  id: {
    type: DataTypes.TEXT,
    defaultValue: Sequelize.fn('uuid_generate_v4'),
    allowNull: false,
    primaryKey: true,
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
    allowNull: false,
    defaultValue: 0,
  },
};

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable(ENCOUNTER_SYNDROMES, {
    ...baseFields,
    encounter_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: 'encounters', key: 'id' },
      onDelete: 'CASCADE',
    },
  });

  await query.addIndex(ENCOUNTER_SYNDROMES, ['encounter_id'], {
    name: `idx_${ENCOUNTER_SYNDROMES}_encounter_id_unique`,
    unique: true,
  });

  await query.createTable(ENCOUNTER_SYNDROME_ITEMS, {
    ...baseFields,
    encounter_syndrome_id: {
      type: DataTypes.TEXT,
      allowNull: false,
      references: { model: ENCOUNTER_SYNDROMES, key: 'id' },
      onDelete: 'CASCADE',
    },
    syndrome_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: 'reference_data', key: 'id' },
    },
    checked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  });

  await query.addIndex(ENCOUNTER_SYNDROME_ITEMS, ['encounter_syndrome_id'], {
    name: `idx_${ENCOUNTER_SYNDROME_ITEMS}_encounter_syndrome_id`,
  });

  await query.addIndex(ENCOUNTER_SYNDROME_ITEMS, ['encounter_syndrome_id', 'syndrome_id'], {
    name: `idx_${ENCOUNTER_SYNDROME_ITEMS}_syndrome_id_unique`,
    unique: true,
  });

  // Both tables are brand new and empty, so there is nothing in sync_lookup to rebuild yet.
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable(ENCOUNTER_SYNDROME_ITEMS);
  await query.dropTable(ENCOUNTER_SYNDROMES);
}
