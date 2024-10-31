import { CursorDataMigration } from '@tamanu/shared/dataMigrations';

export class AppointmentTypeReferenceData extends CursorDataMigration {
  static defaultBatchSize = Number.MAX_SAFE_INTEGER;

  static defaultDelayMs = 50;

  lastMaxId = '';

  async getQuery() {
    return `
      with updated as (
      update appointments
      set appointment_type_id = case type_legacy
       when 'Standard' then 'appointmentType-standard'
       when 'Emergency' then 'appointmentType-emergency'
       when 'Specialist' then 'appointmentType-specialist'
       when 'Other' then 'appointmentType-other'
      end
      where id in (
          select id
          from appointments
          where id > $fromId and type_legacy in ('Standard', 'Emergency', 'Specialist', 'Other')
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
