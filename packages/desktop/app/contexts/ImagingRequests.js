import React, { useContext, createContext, useState, useCallback } from 'react';
import { IMAGING_TABLE_VERSIONS } from '@tamanu/shared/constants/imaging';

const ImagingRequestsContext = createContext({});

const IMAGING_REQUEST_SEARCH_KEYS = {
  ACTIVE: IMAGING_TABLE_VERSIONS.ACTIVE.memoryKey,
  COMPLETED: IMAGING_TABLE_VERSIONS.COMPLETED.memoryKey,
};

// This key is used to store seperate search parameters for the different kinds of imaging request tables
export const useImagingRequests = (key = IMAGING_REQUEST_SEARCH_KEYS.ACTIVE) => {
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

export const ImagingRequestsProvider = ({ children }) => {
  const [searchParameters, setSearchParameters] = useState({
    [IMAGING_REQUEST_SEARCH_KEYS.ACTIVE]: {},
    [IMAGING_REQUEST_SEARCH_KEYS.COMPLETED]: {},
  });

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
