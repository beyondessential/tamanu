import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { debounce } from 'lodash';
import { SETTINGS_SCOPES, WS_EVENTS } from '@tamanu/constants';

import { useSocket } from '../utils/useSocket';
import { refreshSettings } from '../store/auth';

const SETTINGS_CHANGE_EVENT = `${WS_EVENTS.DATABASE_TABLE_CHANGED}:settings`;

const isRelevantChange = (payload, currentFacilityId) => {
  // Defensive: legacy payloads or older facility servers may omit scope.
  if (!payload || !payload.scope) return true;
  if (payload.scope === SETTINGS_SCOPES.CENTRAL) return false;
  if (payload.scope === SETTINGS_SCOPES.GLOBAL) return true;
  return payload.facilityId === currentFacilityId;
};

/**
 * Re-fetches frontend settings into redux when the server broadcasts a settings
 * table change. Mounted only when authenticated (see SettingsProvider).
 */
export const SettingsRefresher = () => {
  const dispatch = useDispatch();
  const facilityId = useSelector(state => state.auth.facilityId);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return undefined;
    const refresh = debounce(() => dispatch(refreshSettings()), 1000);
    const handler = payload => {
      if (isRelevantChange(payload, facilityId)) refresh();
    };
    socket.on(SETTINGS_CHANGE_EVENT, handler);
    return () => {
      socket.off(SETTINGS_CHANGE_EVENT, handler);
      refresh.cancel();
    };
  }, [socket, dispatch, facilityId]);

  return null;
};
