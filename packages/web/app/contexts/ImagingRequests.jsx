import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { USER_PREFERENCES_KEYS } from '@tamanu/constants';
import { IMAGING_TABLE_VERSIONS } from '@tamanu/constants/imaging';
import { useUserPreferencesQuery } from '../api/queries';
import { useUserPreferencesMutation } from '../api/mutations';
import { useAuth } from './Auth';

const ImagingRequestsContext = createContext({});

const IMAGING_REQUEST_SEARCH_KEYS = {
  ACTIVE: IMAGING_TABLE_VERSIONS.ACTIVE.memoryKey,
  COMPLETED: IMAGING_TABLE_VERSIONS.COMPLETED.memoryKey,
};

// This key is used to store separate search parameters for the different kinds of imaging request tables
export const useImagingRequestsQuery = (key = IMAGING_REQUEST_SEARCH_KEYS.ACTIVE) => {
  const {
    searchParameters: allSearchParameters,
    setSearchParameters: setAllSearchParameters,
    ...otherProps
  } = useContext(ImagingRequestsContext);

  const searchParameters = allSearchParameters[key];
  const setSearchParameters = useCallback(
    (value) => {
      setAllSearchParameters({
        ...allSearchParameters,
        [key]: value,
      });
    },
    [key, allSearchParameters, setAllSearchParameters],
  );

  return { searchParameters, setSearchParameters, ...otherProps };
};

export const ImagingRequestsProvider = ({ children }) => {
  const { facilityId } = useAuth();
  const [searchParameters, setSearchParameters] = useState({
    [IMAGING_REQUEST_SEARCH_KEYS.ACTIVE]: {},
    [IMAGING_REQUEST_SEARCH_KEYS.COMPLETED]: {},
  });
  const [hasLoadedPreferences, setHasLoadedPreferences] = useState(false);

  const { data: userPreferences, isLoading: isLoadingPreferences } = useUserPreferencesQuery();
  const { mutateAsync: mutateUserPreferences } = useUserPreferencesMutation(facilityId);

  useEffect(() => {
    if (!isLoadingPreferences && !hasLoadedPreferences && userPreferences) {
      if (userPreferences?.imagingRequestSearchParameters) {
        setSearchParameters(userPreferences.imagingRequestSearchParameters);
      }
      setHasLoadedPreferences(true);
    }
  }, [userPreferences, isLoadingPreferences, hasLoadedPreferences]);

  const setSearchParametersWithPersist = useCallback(
    (newSearchParameters) => {
      setSearchParameters(newSearchParameters);
      mutateUserPreferences({
        key: USER_PREFERENCES_KEYS.IMAGING_REQUEST_SEARCH_PARAMETERS,
        value: newSearchParameters,
      });
    },
    [mutateUserPreferences],
  );

  return (
    <ImagingRequestsContext.Provider
      value={{
        searchParameters,
        setSearchParameters: setSearchParametersWithPersist,
      }}
    >
      {children}
    </ImagingRequestsContext.Provider>
  );
};
