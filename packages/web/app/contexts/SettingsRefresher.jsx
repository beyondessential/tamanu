import { useEffect } from 'react';
import { debounce } from 'es-toolkit/compat';
import { WS_EVENTS } from '@tamanu/constants';

import { useSocket } from '../utils/useSocket';
import { useAuth } from './Auth';

const SETTINGS_CHANGE_EVENT = `${WS_EVENTS.DATABASE_TABLE_CHANGED}:settings`;

/**
 * Re-fetches frontend settings into the auth state when the server broadcasts a settings
 * table change for the signed-in session.
 */
export const SettingsRefresher = () => {
  const { refreshSettings } = useAuth();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return undefined;
    const refresh = debounce(refreshSettings, 1000);
    socket.on(SETTINGS_CHANGE_EVENT, refresh);
    return () => {
      socket.off(SETTINGS_CHANGE_EVENT, refresh);
      refresh.cancel();
    };
  }, [socket, refreshSettings]);

  return null;
};
