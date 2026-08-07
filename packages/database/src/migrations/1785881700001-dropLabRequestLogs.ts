import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query('DROP TABLE lab_request_logs;');
}

// DESTRUCTIVE: recreates the table and its triggers, but the rows are gone.
// Their content lives on as the changelog entries the previous migration made.
export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE TABLE lab_request_logs (
      id character varying(255) DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
      deleted_at timestamp with time zone,
      status character varying(31) NOT NULL,
      lab_request_id character varying(255),
      updated_by_id character varying(255),
      updated_at_sync_tick bigint DEFAULT 0 NOT NULL
    );
    CREATE INDEX lab_request_logs_updated_at ON lab_request_logs USING btree (updated_at);
    CREATE INDEX lab_request_logs_updated_at_sync_tick_index ON lab_request_logs USING btree (updated_at_sync_tick);
    CREATE TRIGGER notify_lab_request_logs_changed
      AFTER INSERT OR DELETE OR UPDATE ON lab_request_logs
      FOR EACH ROW EXECUTE FUNCTION notify_table_changed();
    CREATE TRIGGER set_lab_request_logs_updated_at
      BEFORE INSERT OR UPDATE ON lab_request_logs
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    CREATE TRIGGER set_lab_request_logs_updated_at_sync_tick
      BEFORE INSERT OR UPDATE ON lab_request_logs
      FOR EACH ROW EXECUTE FUNCTION set_updated_at_sync_tick();
    CREATE CONSTRAINT TRIGGER record_lab_request_logs_changelog
      AFTER INSERT OR UPDATE ON lab_request_logs
      DEFERRABLE INITIALLY DEFERRED
      FOR EACH ROW EXECUTE FUNCTION logs.record_change();
  `);
}
