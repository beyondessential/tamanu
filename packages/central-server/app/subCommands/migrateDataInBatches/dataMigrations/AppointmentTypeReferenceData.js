import { CursorDataMigration } from '@tamanu/shared/dataMigrations';

export class AppointmentTypeReferenceData extends CursorDataMigration {
  static defaultBatchSize = Number.MAX_SAFE_INTEGER;

  static defaultDelayMs = 50;

  lastMaxId = '';

  async getQuery() {
    return `
      with updated as (
      update appointments
      set type = case type
       when 'standard' then 'appointmentType-standard'
       when 'emergency' then 'appointmentType-emergency'
       when 'specialist' then 'appointmentType-specialist'
       when 'other' then 'appointmentType-other'
      end
      where id in (
          select id
          from appointments
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
