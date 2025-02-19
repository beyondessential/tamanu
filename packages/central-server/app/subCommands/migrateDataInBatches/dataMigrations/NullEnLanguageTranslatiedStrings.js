import { CursorDataMigration } from '@tamanu/database/dataMigrations';

export class NullEnLanguageTranslatiedStrings extends CursorDataMigration {
  static defaultBatchSize = Number.MAX_SAFE_INTEGER;

  static defaultDelayMs = 50;

  lastMaxId = '';

  async getQuery() {
    return `
      with updated as (
      update translated_strings
      set language = null
      where id in (
          select id
          from translated_strings
          where id > $fromId and language = 'en'
          order by id
          limit $limit
      )
      returning id
      )
      select
        max(id::text) as "maxId",
        count(id) as "count"
      from updated;
    `;
  }
}
