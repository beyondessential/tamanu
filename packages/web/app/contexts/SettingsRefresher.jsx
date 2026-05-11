import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { debounce } from 'lodash';
import { WS_EVENTS } from '@tamanu/constants';

import { useSocket } from '../utils/useSocket';
import { refreshSettings } from '../store/auth';

const SETTINGS_CHANGE_EVENT = `${WS_EVENTS.DATABASE_TABLE_CHANGED}:settings`;

/**
 * Re-fetches frontend settings into redux when the server broadcasts a settings
 * table change for the selected facility session.
 */
export const SettingsRefresher = () => {
  const dispatch = useDispatch();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return undefined;
    const refresh = debounce(() => dispatch(refreshSettings()), 1000);
    socket.on(SETTINGS_CHANGE_EVENT, refresh);
    return () => {
      socket.off(SETTINGS_CHANGE_EVENT, refresh);
      refresh.cancel();
    };
  }, [socket, dispatch]);

  return null;
};
