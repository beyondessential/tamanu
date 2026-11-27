import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { getLoginErrorMessage } from '@tamanu/errors';
import { buildAbility, buildAbilityForUser } from '@tamanu/shared/permissions/buildAbility';
import { AuthContext, useAuth as useAuthFromUi } from '@tamanu/ui-components';

import { useApi } from '../api';
import { LOCAL_STORAGE_KEYS } from '../constants';
import { systemErrorStore } from '../state/systemErrorStore';

// Reset when a sign-in starts or a session ends
const SIGNED_OUT_STATE = {
  user: null,
  role: null,
  availableFacilities: [],
  facilityId: null,
  primaryTimeZone: null,
  settings: null,
  error: null,
  token: null,
  impersonatingRole: null,
};

const INITIAL_STATE = {
  ...SIGNED_OUT_STATE,
  // Outlives sign-out, so the login screen can tell the same user returning from a different one.
  lastUserEmail: null,
  ability: null,
  localisation: null,
  server: null,
};

const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.';
const IDLE_TIMEOUT_MESSAGE = 'You have been logged out due to inactivity';

// Match backend logic: when impersonating, retain ability to read/write own User record
const buildImpersonationAbility = (permissions, userId) =>
  buildAbility([
    ...permissions,
    { verb: 'read', noun: 'User', objectId: userId },
    { verb: 'write', noun: 'User', objectId: userId },
  ]);

export const AuthProvider = ({ children }) => {
  const api = useApi();
  const queries = useQueryClient();
  const navigate = useNavigate();

  const [auth, setAuth] = useState(INITIAL_STATE);
  // The latest auth state, for reads that can't wait for a re-render: a request that settles after
  // the session changed, and a navigation blocker checked in the same tick as a sign-out
  const latestAuth = useRef(INITIAL_STATE);
  const updateAuth = useCallback(changes => {
    latestAuth.current = { ...latestAuth.current, ...changes };
    setAuth(latestAuth.current);
  }, []);
  const [isRestoring, setIsRestoring] = useState(true);

  const checkIsLoggedIn = useCallback(() => Boolean(latestAuth.current.user), []);

  const selectFacility = useCallback(
    async facilityId => {
      try {
        const { settings } = await api.setFacility(facilityId);
        updateAuth({ facilityId, settings });
      } catch (error) {
        updateAuth({ error: error.message });
      }
    },
    [api, updateAuth],
  );

  const startSession = useCallback(
    async ({
      user,
      token,
      localisation,
      server,
      availableFacilities,
      facilityId,
      ability,
      role,
      settings,
      permissions,
      impersonatedRole,
      primaryTimeZone,
    }) => {
      if (facilityId) {
        await selectFacility(facilityId);
      } else {
        const onlyFacilityId = availableFacilities?.length === 1 ? availableFacilities[0].id : null;
        if (onlyFacilityId) {
          await selectFacility(onlyFacilityId);
        }
      }

      if (settings) {
        updateAuth({ settings });
      }

      systemErrorStore.clear();
      updateAuth({
        user,
        lastUserEmail: user.email,
        primaryTimeZone,
        ability,
        availableFacilities,
        error: null,
        token,
        localisation,
        server,
        role,
      });

      if (impersonatedRole && user.role === 'admin') {
        updateAuth({
          impersonatingRole: impersonatedRole,
          ability: buildImpersonationAbility(permissions, user.id),
        });
      }
    },
    [selectFacility, updateAuth],
  );

  const login = useCallback(
    async (email, password) => {
      updateAuth(SIGNED_OUT_STATE);
      try {
        const loginInfo = await api.login(email, password);
        await startSession(loginInfo);
        return true;
      } catch (error) {
        updateAuth({ error: getLoginErrorMessage(error) });
        return false;
      }
    },
    [api, startSession, updateAuth],
  );

  const restoreSession = useCallback(async () => {
    try {
      const loginInfo = await api.restoreSession();
      await startSession(loginInfo);
    } catch (e) {
      // no action required -- this just means we haven't logged in
    }
  }, [api, startSession]);

  const refreshSettings = useCallback(async () => {
    // Best-effort: the next change event or login will reconcile if this fails.
    // The admin panel's session has no facility, and reads central's settings.
    const { user: userAtStart, facilityId: facilityIdAtStart } = latestAuth.current;
    try {
      const settings = await api.fetchFrontEndSettings(facilityIdAtStart);
      if (!settings) return;
      // If the user switched facility or logged out while the request was in flight,
      // the response is for the previous session - drop it so we don't clobber the
      // freshly-loaded (or freshly-cleared) settings in state/localStorage.
      const { user, facilityId } = latestAuth.current;
      if (user !== userAtStart || facilityId !== facilityIdAtStart) return;
      api.persistSettings(settings);
      updateAuth({ settings });
    } catch (e) {
      // ignore
    }
  }, [api, updateAuth]);

  // spec: BTEL
  // Every way out of a session (logout, idle timeout, auth failure, incompatible version) ends
  // here, so the api client forgets the user here rather than on each path. Browser telemetry
  // reads the user and sign-in from the api client, so the login screen sends neither.
  const endSession = useCallback(
    (error = null) => {
      api.setUser(null);
      updateAuth({ ...SIGNED_OUT_STATE, error });
    },
    [api, updateAuth],
  );

  // Ends the session without clearing the stored one or navigating; onLogout does both.
  const logout = useCallback(() => {
    systemErrorStore.clear();
    endSession();
  }, [endSession]);

  const startImpersonation = useCallback(
    async role => {
      const { token, permissions } = await api.post('admin/impersonate', { roleId: role.id });
      const ability = buildImpersonationAbility(permissions, latestAuth.current.user.id);
      api.setToken(token);
      // Render the role before resolving: the caller refreshes queries next, and those the role
      // can't see should unmount rather than refetch with its token
      flushSync(() => updateAuth({ impersonatingRole: role, ability }));
    },
    [api, updateAuth],
  );

  const stopImpersonation = useCallback(async () => {
    const { token, permissions } = await api.post('admin/impersonate', { roleId: null });
    const ability = buildAbilityForUser(latestAuth.current.user, permissions);
    api.setToken(token);
    // Rendered before resolving, as for startImpersonation
    flushSync(() => updateAuth({ impersonatingRole: null, ability }));
  }, [api, updateAuth]);

  useEffect(() => {
    void (async () => {
      await restoreSession();
      // Listen for the server ending the session only once the restore settles, so a stored
      // session that has lapsed goes to the login screen without an error.
      api.setAuthFailureHandler(() => endSession(SESSION_EXPIRED_MESSAGE));
      api.setVersionIncompatibleHandler(message => {
        // This logs the user out without the sign-in error that clears the saved session, and
        // telemetry reads its enablement from the saved settings
        window.localStorage.removeItem(LOCAL_STORAGE_KEYS.SETTINGS);
        endSession(message);
      });
      setIsRestoring(false);
    })();
  }, [api, restoreSession, endSession]);

  const cleanupSession = useCallback(() => {
    window?.localStorage?.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
    // Telemetry reads its enablement from the saved settings, so a signed-out
    // browser must not keep the last session's.
    window?.localStorage?.removeItem(LOCAL_STORAGE_KEYS.SETTINGS);
    queries.removeQueries({ predicate: ({ queryKey }) => queryKey[0] !== 'serverAlive' });
    navigate('/');
  }, [queries, navigate]);

  const onLogout = useCallback(() => {
    logout();
    cleanupSession();
  }, [logout, cleanupSession]);

  const onTimeout = useCallback(() => {
    endSession(IDLE_TIMEOUT_MESSAGE);
    cleanupSession();
  }, [endSession, cleanupSession]);

  const refreshToken = useCallback(() => api.refreshToken(), [api]);

  const value = useMemo(
    () => ({
      currentUser: auth.user,
      ability: auth.ability,
      facilityId: auth.facilityId,
      currentRole: auth.role,
      primaryTimeZone: auth.primaryTimeZone,
      impersonatingRole: auth.impersonatingRole,
      availableFacilities: auth.availableFacilities,
      authError: auth.error,
      lastUserEmail: auth.lastUserEmail,
      localisation: auth.localisation,
      serverType: auth.server?.type,
      settings: auth.settings,
      token: auth.token,
      isRestoring,
      checkIsLoggedIn,
      login,
      selectFacility,
      refreshSettings,
      startImpersonation,
      stopImpersonation,
      logout,
      onLogout,
      onTimeout,
      refreshToken,
    }),
    [
      auth,
      isRestoring,
      checkIsLoggedIn,
      login,
      selectFacility,
      refreshSettings,
      startImpersonation,
      stopImpersonation,
      logout,
      onLogout,
      onTimeout,
      refreshToken,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useAuthFromUi();
