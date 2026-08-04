import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query('DROP TABLE vital_logs;');
}

// DESTRUCTIVE: recreates the table and its triggers, but the rows are gone.
// Their content lives on as the changelog entries the previous migration made.
export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE TABLE vital_logs (
      id character varying(255) DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
      deleted_at timestamp with time zone,
      date date_time_string NOT NULL,
      previous_value text,
      new_value text,
      reason_for_change text,
      recorded_by_id character varying(255) REFERENCES users (id),
      answer_id character varying(255) NOT NULL REFERENCES survey_response_answers (id),
      updated_at_sync_tick bigint DEFAULT 0 NOT NULL
    );
    CREATE INDEX vital_logs_answer_id ON vital_logs USING btree (answer_id);
    CREATE INDEX vital_logs_updated_at_sync_tick_index ON vital_logs USING btree (updated_at_sync_tick);
    CREATE TRIGGER notify_vital_logs_changed
      AFTER INSERT OR DELETE OR UPDATE ON vital_logs
      FOR EACH ROW EXECUTE FUNCTION notify_table_changed();
    CREATE TRIGGER set_vital_logs_updated_at
      BEFORE INSERT OR UPDATE ON vital_logs
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    CREATE TRIGGER set_vital_logs_updated_at_sync_tick
      BEFORE INSERT OR UPDATE ON vital_logs
      FOR EACH ROW EXECUTE FUNCTION set_updated_at_sync_tick();
    CREATE CONSTRAINT TRIGGER record_vital_logs_changelog
      AFTER INSERT OR UPDATE ON vital_logs
      DEFERRABLE INITIALLY DEFERRED
      FOR EACH ROW EXECUTE FUNCTION logs.record_change();
  `);
}
