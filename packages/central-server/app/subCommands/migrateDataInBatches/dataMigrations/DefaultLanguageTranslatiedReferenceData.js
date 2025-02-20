import { DEFAULT_LANGUAGE_CODE } from '@tamanu/constants';
import { CursorDataMigration } from '@tamanu/database/dataMigrations';

export class DefaultLanguageTranslatiedReferenceData extends CursorDataMigration {
  static defaultBatchSize = Number.MAX_SAFE_INTEGER;

  static defaultDelayMs = 50;

  lastMaxId = '';

  async getQuery() {
    return `
      with updated as (
      update translated_strings
      set language = '${DEFAULT_LANGUAGE_CODE}'
      where id in (
          select id
          from translated_strings
          where language = 'en' and split_part(string_id, '.', 1) = 'refData' and id > $fromId
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
