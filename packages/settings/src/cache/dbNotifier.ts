import { NOTIFY_CHANNELS } from '@tamanu/constants';
import { settingsCache } from './settingsCache';

const SETTINGS_TABLE = 'settings';

interface TableChangedPayload {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  oldId?: string;
  newId?: string;
  changedColumns?: string[];
}

interface DbNotifier {
  listeners: {
    [channel: string]: (callback: (payload: TableChangedPayload) => void) => void;
  };
}

/**
 * Subscribes to the database table_changed NOTIFY channel and resets the in-memory
 * settings cache whenever the settings table changes. Using a database-level trigger
 * means cache invalidation also fires for changes made via raw SQL or migrations,
 * not just Sequelize model writes.
 */
export const registerSettingsCacheInvalidator = (dbNotifier: DbNotifier): void => {
  const onTableChanged = dbNotifier.listeners[NOTIFY_CHANNELS.TABLE_CHANGED];
  if (!onTableChanged) {
    throw new Error(
      `dbNotifier is not subscribed to the ${NOTIFY_CHANNELS.TABLE_CHANGED} channel`,
    );
  }
  onTableChanged((payload) => {
    if (payload.table === SETTINGS_TABLE) {
      settingsCache.reset();
    }
  });
};
