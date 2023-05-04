import React, { useContext, createContext, useState, useCallback } from 'react';

const ImagingRequestsContext = createContext({});

export const IMAGING_REQUEST_SEARCH_KEYS = {
  ALL: 'ImagingRequestListingView',
  COMPLETED: 'CompletedImagingRequestListingView',
};

// This key is used to store seperate search parameters for the different kinds of imaging request tables
export const useImagingRequests = (key = IMAGING_REQUEST_SEARCH_KEYS.ALL) => {
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
    [IMAGING_REQUEST_SEARCH_KEYS.ALL]: {},
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
