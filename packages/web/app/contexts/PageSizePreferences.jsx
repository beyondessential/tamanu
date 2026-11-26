import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  useAdminUserPreferencesMutation,
  useUserPreferencesMutation,
} from '../api/mutations/useUserPreferencesMutation';
import { useAdminUserPreferencesQuery, useUserPreferencesQuery } from '../api/queries';
import { useAuth } from './Auth';

// One preferences query and one save queue, shared by every table with a remembered page size or
// sort rather than each table observing them itself. Read through usePageSizePreference and
// useSortPreference.
// spec: TPAGE#remembered-page-size
// spec: TPAGE#remembered-sort
export const PageSizePreferencesContext = createContext(null);

// How long tables wait for the preferences before opening at the default size
const PREFERENCES_WAIT_MS = 5_000;

const PageSizePreferencesProvider = ({
  preferencesQuery,
  savePreferenceAsync,
  saveFacilityPreferenceAsync,
  children,
}) => {
  // A request on a stalled connection neither loads nor fails, so tables stop waiting on it
  const [hasStoppedWaiting, setHasStoppedWaiting] = useState(false);
  useEffect(() => {
    if (!preferencesQuery.isLoading) return undefined;
    const timer = setTimeout(() => setHasStoppedWaiting(true), PREFERENCES_WAIT_MS);
    return () => clearTimeout(timer);
  }, [preferencesQuery.isLoading]);

  // React Query holds a request while the browser reports itself offline, though the server may
  // still be reachable on the local network. Tables load at the default size rather than wait.
  const isLoaded = !preferencesQuery.isLoading || preferencesQuery.isPaused || hasStoppedWaiting;

  const previousSave = useRef(Promise.resolve());
  const queueSave = useCallback(save => {
    // Each save waits for the one before it, so the server applies the user's picks in order
    previousSave.current = previousSave.current.then(save).catch(() => {});
  }, []);
  const savePreference = useCallback(
    preference => queueSave(() => savePreferenceAsync(preference)),
    [queueSave, savePreferenceAsync],
  );

  // Read back straight away, so a table shown again before the save and reload land still has it
  const [facilityPreferencesSaved, setFacilityPreferencesSaved] = useState({});
  const saveFacilityPreference = useCallback(
    preference => {
      setFacilityPreferencesSaved(saved => ({ ...saved, [preference.key]: preference.value }));
      queueSave(() => saveFacilityPreferenceAsync(preference));
    },
    [queueSave, saveFacilityPreferenceAsync],
  );

  const preferences = useMemo(
    () => ({ ...preferencesQuery.data, ...facilityPreferencesSaved }),
    [preferencesQuery.data, facilityPreferencesSaved],
  );
  const value = useMemo(
    () => ({ preferences, isLoaded, savePreference, saveFacilityPreference }),
    [preferences, isLoaded, savePreference, saveFacilityPreference],
  );
  return (
    <PageSizePreferencesContext.Provider value={value}>
      {children}
    </PageSizePreferencesContext.Provider>
  );
};

// The clinical app keeps the user's preferences on the facility server, and the admin panel on the
// central server. Page sizes are saved with no facility, so they follow the user everywhere, and
// sorts with the facility logged in to, like the search filters beside them. Each
// provider sits inside App, which holds its children back until login, so the preferences are
// fetched as soon as the user is logged in and tables rarely wait on them.
export const FacilityPageSizePreferencesProvider = ({ children }) => {
  const { facilityId } = useAuth();
  const preferencesQuery = useUserPreferencesQuery();
  const { mutateAsync: savePreferenceAsync } = useUserPreferencesMutation();
  const { mutateAsync: saveFacilityPreferenceAsync } = useUserPreferencesMutation(facilityId);
  return (
    <PageSizePreferencesProvider
      preferencesQuery={preferencesQuery}
      savePreferenceAsync={savePreferenceAsync}
      saveFacilityPreferenceAsync={saveFacilityPreferenceAsync}
    >
      {children}
    </PageSizePreferencesProvider>
  );
};

export const AdminPageSizePreferencesProvider = ({ children }) => {
  const preferencesQuery = useAdminUserPreferencesQuery();
  const { mutateAsync: savePreferenceAsync } = useAdminUserPreferencesMutation();
  return (
    <PageSizePreferencesProvider
      preferencesQuery={preferencesQuery}
      savePreferenceAsync={savePreferenceAsync}
    >
      {children}
    </PageSizePreferencesProvider>
  );
};
