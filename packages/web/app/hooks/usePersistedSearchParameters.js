import { useCallback, useEffect, useRef, useState } from 'react';
import { mapValues, omit } from 'es-toolkit/compat';

import { useUserPreferencesMutation } from '../api/mutations';
import { useUserPreferencesQuery } from '../api/queries';
import { useAuth } from '../contexts/Auth';

// Lookups for one patient or request, which a later session shouldn't open filtered by.
const LOOKUP_FIELDS = ['displayId', 'firstName', 'lastName', 'requestId', 'requestNumber'];

/**
 * Search parameters for a set of tables, keyed by table, remembered per user and facility.
 * @param {string} preferenceKey - a USER_PREFERENCES_KEYS value
 * @param {object} initialValue - empty search parameters for each table
 */
export const usePersistedSearchParameters = (preferenceKey, initialValue) => {
  const { currentUser, facilityId } = useAuth();
  const session = currentUser && facilityId ? `${currentUser.id}:${facilityId}` : null;
  const { data: userPreferences } = useUserPreferencesQuery({ enabled: Boolean(session) });
  const { mutate: saveUserPreference } = useUserPreferencesMutation(facilityId);
  const [searchParameters, setSearchParametersState] = useState(initialValue);
  const loadedForSession = useRef(null);

  useEffect(() => {
    if (loadedForSession.current === session) return;
    loadedForSession.current = null;
    setSearchParametersState(initialValue);
    if (!session || !userPreferences) return;
    loadedForSession.current = session;
    setSearchParametersState({ ...initialValue, ...userPreferences[preferenceKey] });
  }, [session, userPreferences, preferenceKey, initialValue]);

  const setSearchParameters = useCallback(
    value => {
      setSearchParametersState(value);
      // Saving holds the whole map, so before the saved one loads it would overwrite it.
      if (loadedForSession.current !== session) return;
      saveUserPreference({
        key: preferenceKey,
        value: mapValues(value, tableParameters => omit(tableParameters, LOOKUP_FIELDS)),
      });
    },
    [session, preferenceKey, saveUserPreference],
  );

  return [searchParameters, setSearchParameters];
};
