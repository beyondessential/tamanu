import { camel } from 'case';
import { StreamMessage } from './StreamMessage';
import { attachChangelogToSnapshotRecords } from '@tamanu/database/utils/audit';

// TODO: Move this to settings
const FETCH_SIZE = 10000;

export async function* streamSnapshotCursor(store, cursorName, { minSourceTick, maxSourceTick }) {
  try {
    while (true) {
      const rows = await store.sequelize.query(`FETCH FORWARD ${FETCH_SIZE} FROM ${cursorName}`, {
        type: store.sequelize.QueryTypes.SELECT,
      });
      if (rows.length === 0) break;

      for (const row of rows) {
        const recased = Object.fromEntries(
          Object.entries(row).map(([key, value]) => [camel(key), value]),
        );

        if (!minSourceTick || !maxSourceTick) {
          yield StreamMessage.pullChange(recased);
          continue;
        }

        const records = await attachChangelogToSnapshotRecords(store, [recased], {
          minSourceTick,
          maxSourceTick,
        });
        for (const record of records) {
          yield StreamMessage.pullChange(record);
        }
      }
    }
    yield StreamMessage.end();
  } finally {
    // Make sure to close the cursor no matter what
    await store.sequelize.query(`CLOSE ${cursorName}`);
  }
}
