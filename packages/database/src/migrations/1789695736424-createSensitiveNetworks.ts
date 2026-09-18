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
    // No updated_at_sync_tick: the addUpdatedAtSyncTickColumn post-migration hook adds it, along
    // with its index, using the right starting value for the server it runs on (0 on central,
    // LAST_UPDATED_ELSEWHERE on facility). Declaring it here would hardcode one of those.
  });

  // UNIQUE constraints rather than unique indexes. Postgres only supports DEFERRABLE on a
  // constraint, and every unique constraint on a syncable table has to be deferrable so the
  // sync-apply transaction can defer validation to its end — otherwise a batch that is only
  // transiently in conflict, such as two networks swapping codes, cannot be applied at all.
  // See TAM-7004 and the uniqueConstraintDeferrability guard test.
  await query.sequelize.query(`
    ALTER TABLE ${SENSITIVE_NETWORKS}
    ADD CONSTRAINT ${SENSITIVE_NETWORKS}_code_unique
      UNIQUE (code)
      DEFERRABLE INITIALLY IMMEDIATE;
  `);
  await query.sequelize.query(`
    ALTER TABLE ${SENSITIVE_NETWORKS}
    ADD CONSTRAINT ${SENSITIVE_NETWORKS}_name_unique
      UNIQUE (name)
      DEFERRABLE INITIALLY IMMEDIATE;
  `);

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

  // Partial, following sync_lookup_needs_rebuild_index. The column is null for every row outside a
  // sensitive network, which is nearly all of them, so a full btree would carry an entry per
  // sync_lookup row and be written on every update of the largest table in the deployment. The
  // snapshot's null branch is served by the tick range scan either way; only the branch matching a
  // specific network is selective, and that one implies the predicate below.
  await query.sequelize.query(`
    CREATE INDEX sync_lookup_sensitive_network_id_index
      ON sync_lookup (sensitive_network_id)
      WHERE sensitive_network_id IS NOT NULL;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`DROP INDEX IF EXISTS sync_lookup_sensitive_network_id_index;`);
  await query.removeColumn('sync_lookup', 'sensitive_network_id');
  await query.removeColumn('facilities', 'sensitive_network_id');
  await query.dropTable(SENSITIVE_NETWORKS);
}
