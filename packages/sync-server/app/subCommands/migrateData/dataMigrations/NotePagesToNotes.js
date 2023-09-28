import { CursorMigration } from './CursorMigration';

export class NotePagesToNotes extends CursorMigration {
  static defaultBatchSize = Number.MAX_SAFE_INTEGER;

  static defaultDelayMs = 50;

  lastMaxId = '00000000-0000-0000-0000-000000000000';

  async getQuery() {
    return `
      WITH inserted AS (
          INSERT INTO notes (
              id,
              created_at,
              updated_at,
              deleted_at,
              note_type,
              record_id,
              record_type,
              date,
              date_legacy,
              visibility_status,
              author_id,
              on_behalf_of_id,
              revised_by_id,
              content
          )
          SELECT 
              note_items.id,
              note_items.created_at,
              note_items.updated_at,
              note_items.deleted_at,
              note_pages.note_type,
              note_pages.record_id,
              note_pages.record_type,
              note_items.date,
              note_items.date_legacy,
              note_pages.visibility_status,
              note_items.author_id,
              note_items.on_behalf_of_id,
              note_items.revised_by_id::uuid,
              note_items.content
          FROM note_items JOIN note_pages on note_items.note_page_id = note_pages.id
          WHERE note_items.id > :fromId
          AND NOT EXISTS (SELECT id FROM notes WHERE id = note_items.id)
          ORDER BY note_items.id
          LIMIT :limit
          RETURNING id
      )
      SELECT 
        MAX(id::text) AS "maxId",
        COUNT(id) AS "count"
      FROM inserted;
    `;
  }
}
