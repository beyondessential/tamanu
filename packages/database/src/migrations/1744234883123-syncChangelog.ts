import { DataTypes, QueryInterface, Sequelize } from 'sequelize';
import { AUDIT_USERID_KEY, AUDIT_PAUSE_KEY } from '@tamanu/constants/database';

const TABLE = { schema: 'logs', tableName: 'changes' };

export async function up(query: QueryInterface): Promise<void> {
  await query.removeIndex(TABLE, ['updated_at_sync_tick'], { using: 'btree' });
  await query.removeIndex(TABLE, ['created_at'], { using: 'btree' });
  await query.removeIndex(TABLE, ['updated_at'], { using: 'btree' });
  await query.removeIndex(TABLE, ['deleted_at'], { using: 'btree' });

  await query.renameColumn(TABLE, 'updated_at_sync_tick', 'record_sync_tick');
  await query.renameColumn(TABLE, 'created_at', 'record_created_at');
  await query.renameColumn(TABLE, 'updated_at', 'record_updated_at');
  await query.renameColumn(TABLE, 'deleted_at', 'record_deleted_at');

  await query.addColumn(TABLE, 'updated_at_sync_tick', {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Used to sync the changelog; see record_sync_tick for the sync tick of the record',
  });
  await query.addColumn(TABLE, 'created_at', {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.fn('now'),
    comment: 'Used to sync the changelog; see record_created_at for the value of the record',
  });
  await query.addColumn(TABLE, 'updated_at', {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.fn('now'),
    comment: 'Used to sync the changelog; see record_updated_at for the value of the record',
  });
  await query.addColumn(TABLE, 'deleted_at', {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Used to sync the changelog; see record_deleted_at for the value of the record',
  });

  await query.addIndex(TABLE, ['record_sync_tick'], { using: 'btree' });
  await query.addIndex(TABLE, ['record_created_at'], { using: 'btree' });
  await query.addIndex(TABLE, ['record_updated_at'], { using: 'btree' });
  await query.addIndex(TABLE, ['record_deleted_at'], { using: 'btree' });

  await query.addIndex(TABLE, ['updated_at_sync_tick'], { using: 'btree' });

  await query.createFunction(
    'logs.record_change',
    [],
    'trigger',
    'plpgsql',
    `
    IF (SELECT get_session_config('${AUDIT_PAUSE_KEY}', 'false')::boolean) THEN
      RETURN NEW;
    END IF;

    INSERT INTO logs.changes (
      table_oid,
      table_schema,
      table_name,
      logged_at,
      updated_by_user_id,
      record_id,
      record_update,
      record_created_at,
      record_updated_at,
      record_deleted_at,
      record_sync_tick,
      record_data
    ) VALUES (
      TG_RELID,                 -- table_oid
      TG_TABLE_SCHEMA,          -- table_schema
      TG_TABLE_NAME,            -- table_name
      CURRENT_TIMESTAMP,        -- logged_at
      get_session_config('${AUDIT_USERID_KEY}', uuid_nil()::text), -- updated_by_user_id
      NEW.id,                   -- record_id
      TG_OP = 'UPDATE',         -- record_update
      NEW.created_at,           -- created_at
      NEW.updated_at,           -- updated_at
      NEW.deleted_at,           -- deleted_at
      NEW.updated_at_sync_tick, -- updated_at_sync_tick
      to_jsonb(NEW.*)           -- record_data
    );
    RETURN NEW;
    `,
    [],
    { force: true },
  );
}

export async function down(query: QueryInterface): Promise<void> {
  await query.createFunction(
    'logs.record_change',
    [],
    'trigger',
    'plpgsql',
    `
    IF (SELECT get_session_config('${AUDIT_PAUSE_KEY}', 'false')::boolean) THEN
      RETURN NEW;
    END IF;

    INSERT INTO logs.changes (
      table_oid,
      table_schema,
      table_name,
      logged_at,
      created_at,
      updated_at,
      deleted_at,
      updated_at_sync_tick,
      updated_by_user_id,
      record_id,
      record_update,
      record_data
    ) VALUES (
      TG_RELID,                 -- table_oid
      TG_TABLE_SCHEMA,          -- table_schema
      TG_TABLE_NAME,            -- table_name
      CURRENT_TIMESTAMP,        -- logged_at
      NEW.created_at,           -- created_at
      NEW.updated_at,           -- updated_at
      NEW.deleted_at,           -- deleted_at
      NEW.updated_at_sync_tick, -- updated_at_sync_tick
      get_session_config('${AUDIT_USERID_KEY}', uuid_nil()::text), -- updated_by_user_id
      NEW.id,                   -- record_id
      TG_OP = 'UPDATE',         -- record_update
      to_jsonb(NEW.*)           -- record_data
    );
    RETURN NEW;
    `,
    [],
    { force: true },
  );

  await query.removeIndex(TABLE, ['updated_at_sync_tick'], { using: 'btree' });

  await query.removeIndex(TABLE, ['record_sync_tick'], { using: 'btree' });
  await query.removeIndex(TABLE, ['record_created_at'], { using: 'btree' });
  await query.removeIndex(TABLE, ['record_updated_at'], { using: 'btree' });
  await query.removeIndex(TABLE, ['record_deleted_at'], { using: 'btree' });

  await query.removeColumn(TABLE, 'updated_at_sync_tick');
  await query.removeColumn(TABLE, 'created_at');
  await query.removeColumn(TABLE, 'updated_at');
  await query.removeColumn(TABLE, 'deleted_at');

  await query.renameColumn(TABLE, 'record_sync_tick', 'updated_at_sync_tick');
  await query.renameColumn(TABLE, 'record_created_at', 'created_at');
  await query.renameColumn(TABLE, 'record_updated_at', 'updated_at');
  await query.renameColumn(TABLE, 'record_deleted_at', 'deleted_at');

  await query.addIndex(TABLE, ['updated_at_sync_tick'], { using: 'btree' });
  await query.addIndex(TABLE, ['created_at'], { using: 'btree' });
  await query.addIndex(TABLE, ['updated_at'], { using: 'btree' });
  await query.addIndex(TABLE, ['deleted_at'], { using: 'btree' });
}
