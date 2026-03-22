import { CursorDataMigration } from '@tamanu/database/dataMigrations';
import { getChangelogToEncounterHistoryQuery } from './getChangelogToEncounterHistoryQuery';
import { NOTE_TYPES } from '@tamanu/constants';

const NOTE_PAGE_SUB_QUERY = `
    select
        np.id,
        np.record_id,
        np.note_type_id,
        ni.author_id as actor_id,
        ni.date,
        ni.content
    from note_pages np
    left join note_items ni on ni.note_page_id = np.id
    join batch_encounters e on np.record_id = e.id
    where note_type_id = '${NOTE_TYPES.SYSTEM}'
    and record_type = 'Encounter'
    order by np.record_id, ni.date
`;

export class ChangelogNotePagesToEncounterHistory extends CursorDataMigration {
  static defaultBatchSize = Number.MAX_SAFE_INTEGER;

  static defaultDelayMs = 50;

  lastMaxId = '';

  async getQuery() {
    return getChangelogToEncounterHistoryQuery(NOTE_PAGE_SUB_QUERY);
  }
}
