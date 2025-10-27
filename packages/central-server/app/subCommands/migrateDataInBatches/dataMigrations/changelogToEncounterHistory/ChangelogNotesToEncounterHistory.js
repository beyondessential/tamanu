import { CursorDataMigration } from '@tamanu/database/dataMigrations';
import { getChangelogToEncounterHistoryQuery } from './getChangelogToEncounterHistoryQuery';
import { NOTE_TYPES } from '@tamanu/constants';

const NOTE_SUB_QUERY = `
    select
        n.id,
        n.record_id,
        n.note_type_id,
        n.author_id as actor_id,
        n.date,
        n.content
    from notes n
    join batch_encounters e on n.record_id = e.id
    where note_type_id = '${NOTE_TYPES.SYSTEM}'
    and record_type = 'Encounter'
    order by n.record_id, n.date
`;

export class ChangelogNotesToEncounterHistory extends CursorDataMigration {
  static defaultBatchSize = Number.MAX_SAFE_INTEGER;

  static defaultDelayMs = 50;

  lastMaxId = '';

  async getQuery() {
    return getChangelogToEncounterHistoryQuery(NOTE_SUB_QUERY);
  }
}
