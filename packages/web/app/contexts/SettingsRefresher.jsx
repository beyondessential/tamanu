import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { debounce } from 'lodash';
import { SETTINGS_SCOPES, WS_EVENTS } from '@tamanu/constants';

import { useSocket } from '../utils/useSocket';
import { refreshSettings } from '../store/auth';

const SETTINGS_CHANGE_EVENT = `${WS_EVENTS.DATABASE_TABLE_CHANGED}:settings`;

const isRelevantChange = (payload, currentFacilityId) => {
  // The Postgres trigger embeds `scope`/`facilityId` directly so this should always
  // be present, but stay defensive for legacy payloads or older facility servers.
  if (!payload || !payload.scope) return true;
  // Server-only scope — never affects what the web frontend reads.
  if (payload.scope === SETTINGS_SCOPES.CENTRAL) return false;
  // Global settings affect every facility's view.
  if (payload.scope === SETTINGS_SCOPES.GLOBAL) return true;
  // Facility-scoped: only refresh if it's our current facility.
  return payload.facilityId === currentFacilityId;
};

/**
 * Subscribes to the facility-server's `database:table-changed:settings` socket event
 * (broadcast whenever the `settings` table changes via the DB notify trigger) and
 * re-fetches the cached frontend settings into redux. Renders nothing.
 *
 * Mount only when authenticated — see SettingsProvider.
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
