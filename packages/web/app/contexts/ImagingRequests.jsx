import React, { createContext, useCallback, useContext } from 'react';
import { USER_PREFERENCES_KEYS } from '@tamanu/constants';
import { IMAGING_TABLE_VERSIONS } from '@tamanu/constants/imaging';

import { usePersistedSearchParameters } from '../hooks/usePersistedSearchParameters';

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
    value => {
      setAllSearchParameters({
        ...allSearchParameters,
        [key]: value,
      });
    },
    [key, allSearchParameters, setAllSearchParameters],
  );

  return { searchParameters, setSearchParameters, ...otherProps };
};

const INITIAL_SEARCH_PARAMETERS = {
  [IMAGING_REQUEST_SEARCH_KEYS.ACTIVE]: {},
  [IMAGING_REQUEST_SEARCH_KEYS.COMPLETED]: {},
};

export const ImagingRequestsProvider = ({ children }) => {
  const [searchParameters, setSearchParameters] = usePersistedSearchParameters(
    USER_PREFERENCES_KEYS.IMAGING_REQUEST_SEARCH_PARAMETERS,
    INITIAL_SEARCH_PARAMETERS,
  );

  return (
    <ImagingRequestsContext.Provider
      value={{
        searchParameters,
        setSearchParameters,
      }}
    >
      {children}
    </ImagingRequestsContext.Provider>
  );
};
