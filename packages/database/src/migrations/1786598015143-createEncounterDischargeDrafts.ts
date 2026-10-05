import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('encounter_discharge_drafts', {
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.fn('gen_random_uuid'),
      allowNull: false,
      primaryKey: true,
    },
    encounter_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'encounters',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    // The clinician whose working state this is. A draft is only ever shown to this user, so
    // one clinician's save cannot discard another's part-finished work.
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    end_date: {
      type: DataTypes.DATETIMESTRING,
      allowNull: true,
    },
    discharger_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    disposition_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // The discharge planning notes this draft's note was seeded from. Held by identity rather
    // than by a saved-at timestamp so the merge on resume stays correct when a planning note is
    // edited after it was written, or arrives out of order through synchronisation.
    seeded_note_ids: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    ordering_clinician_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
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
  });

  // One draft per clinician per encounter. Clearing one removes the row, so there is no
  // soft-deleted state for the constraint to work around.
  await query.addIndex('encounter_discharge_drafts', ['encounter_id', 'user_id'], {
    name: 'encounter_discharge_drafts_encounter_user_unique',
    unique: true,
  });

  await query.createTable('encounter_discharge_draft_medications', {
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.fn('gen_random_uuid'),
      allowNull: false,
      primaryKey: true,
    },
    discharge_draft_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'encounter_discharge_drafts',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    prescription_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'prescriptions',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    repeats: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    send_to_pharmacy: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
  });

  await query.addIndex('encounter_discharge_draft_medications', ['discharge_draft_id'], {
    name: 'encounter_discharge_draft_medications_draft_idx',
  });

  await query.removeColumn('encounters', 'discharge_draft');

  // encounters is a synced model and sync_lookup materialises a json object of the model's
  // columns, so rows built before this migration still carry a dischargeDraft key. The lookup
  // has to be rebuilt for the column to disappear from what clients pull.
  // Note: this is expensive on a large encounters table.
  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('encounters');`);
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: the column comes back empty. Drafts saved under the new tables are dropped
  // with them and are not written back into encounters.discharge_draft.
  await query.addColumn('encounters', 'discharge_draft', {
    type: DataTypes.JSONB,
    allowNull: true,
  });

  await query.dropTable('encounter_discharge_draft_medications');
  await query.dropTable('encounter_discharge_drafts');

  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('encounters');`);
}
