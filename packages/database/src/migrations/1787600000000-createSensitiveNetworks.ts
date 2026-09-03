import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

const SENSITIVE_NETWORKS = 'sensitive_networks';

// DDL only: the sensitive network data model (spec: specs/sync/sensitive-networks.md).
// The backfill of existing sensitive facilities is a separate DML migration, and
// facilities.is_sensitive is dropped in a third once that backfill has read it.
export async function up(query: QueryInterface): Promise<void> {
  await query.createTable(SENSITIVE_NETWORKS, {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    code: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
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
  });

  await query.addIndex(SENSITIVE_NETWORKS, ['code'], {
    name: `${SENSITIVE_NETWORKS}_code_unique`,
    unique: true,
  });
  await query.addIndex(SENSITIVE_NETWORKS, ['name'], {
    name: `${SENSITIVE_NETWORKS}_name_unique`,
    unique: true,
  });

  // A facility belongs to at most one network, and is sensitive exactly when this is set.
  await query.addColumn('facilities', 'sensitive_network_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: SENSITIVE_NETWORKS,
      key: 'id',
    },
  });

  // Takes over from facility_id for sensitive-data scoping. facility_id keeps scoping records
  // that are genuinely facility-bound, such as patient_facilities and facility-scoped settings.
  await query.addColumn('sync_lookup', 'sensitive_network_id', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  // Every outgoing snapshot filters on this column.
  await query.addIndex('sync_lookup', ['sensitive_network_id'], {
    name: 'sync_lookup_sensitive_network_id_index',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('sync_lookup', 'sensitive_network_id');
  await query.removeColumn('facilities', 'sensitive_network_id');
  await query.dropTable(SENSITIVE_NETWORKS);
}
