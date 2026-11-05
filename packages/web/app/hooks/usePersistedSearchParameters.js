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
  const { data: userPreferences } = useUserPreferencesQuery({
    enabled: Boolean(currentUser && facilityId),
  });
  const { mutate: saveUserPreference } = useUserPreferencesMutation(facilityId);
  const [searchParameters, setSearchParametersState] = useState(initialValue);
  const loadedForUserId = useRef(null);

  useEffect(() => {
    if (!userPreferences || loadedForUserId.current === currentUser?.id) return;
    loadedForUserId.current = currentUser?.id;
    setSearchParametersState({ ...initialValue, ...userPreferences[preferenceKey] });
  }, [userPreferences, currentUser?.id, preferenceKey, initialValue]);

  const setSearchParameters = useCallback(
    value => {
      setSearchParametersState(value);
      saveUserPreference({
        key: preferenceKey,
        value: mapValues(value, tableParameters => omit(tableParameters, LOOKUP_FIELDS)),
      });
    },
    [preferenceKey, saveUserPreference],
  );

  return [searchParameters, setSearchParameters];
};
