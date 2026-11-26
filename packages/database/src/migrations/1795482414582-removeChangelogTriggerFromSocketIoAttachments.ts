import { QueryInterface } from 'sequelize';

// socket_io_attachments has no updated_at or deleted_at, so logs.record_change() failed every
// write to it. It is now in NON_LOGGED_TABLES, but the addRecordChangeTrigger post-migration hook
// only adds missing triggers, so the existing one is dropped here.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    DROP TRIGGER IF EXISTS record_socket_io_attachments_changelog ON public.socket_io_attachments;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE CONSTRAINT TRIGGER record_socket_io_attachments_changelog
    AFTER INSERT OR UPDATE OR DELETE ON public.socket_io_attachments
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION logs.record_change();
  `);
}
