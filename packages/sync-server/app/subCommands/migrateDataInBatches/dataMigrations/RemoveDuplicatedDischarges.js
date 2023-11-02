import { CursorDataMigration } from '@tamanu/shared/dataMigrations';

export class RemoveDuplicatedDischarges extends CursorDataMigration {
  static defaultBatchSize = Number.MAX_SAFE_INTEGER;

  static defaultDelayMs = 50;

  lastMaxId = '';

  async getQuery() {
    return `
      WITH

      -- For batching by encounters
      batch_encounters as (
          SELECT * FROM encounters
          WHERE id > $fromId
          AND deleted_at IS NULL
          ORDER BY id
          LIMIT $limit
      ),

      ordered_discharges AS
      (
          SELECT discharges.id,
          discharges.encounter_id,
          row_number() over (PARTITION BY encounter_id ORDER BY encounter_id, discharges.created_at ASC) as row_num
          FROM discharges
          JOIN batch_encounters ON batch_encounters.id = discharges.encounter_id
          WHERE discharges.deleted_at IS NULL
      ),

      deleted_discharges AS
      (
          UPDATE discharges
          SET deleted_at = now()
          WHERE id IN (SELECT id FROM ordered_discharges WHERE row_num > 1)
          RETURNING encounter_id
      )

      SELECT MAX(id) as "maxId" FROM batch_encounters;
    `;
  }
}
