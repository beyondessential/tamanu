import { CursorDataMigration } from '@tamanu/database/dataMigrations';

export class ReferenceDataICD10ToDiagnosis extends CursorDataMigration {
  static defaultBatchSize = Number.MAX_SAFE_INTEGER;

  static defaultDelayMs = 50;

  lastMaxId = '';

  async getQuery() {
    return `
      with updated as (
      update reference_data
      set type = 'diagnosis'
      where id in (
          select id
          from reference_data
          where type = 'icd10'
          and id > $fromId
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
