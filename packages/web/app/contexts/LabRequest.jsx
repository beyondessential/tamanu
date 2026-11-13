import React, { createContext, useCallback, useContext } from 'react';
import { USER_PREFERENCES_KEYS } from '@tamanu/constants';
import { usePersistedSearchParameters } from '../hooks/usePersistedSearchParameters';

// Holds the lab request listing filters only. The request being viewed is loaded from the route
// by `useLabRequestQuery`, never held here.
const LabRequestContext = createContext({});

export const LabRequestSearchParamKeys = {
  All: 'LabRequestListingView',
  Finalised: 'FinalisedLabRequestsListingView',
  Other: 'OtherView',
};

export const useLabRequest = (key = LabRequestSearchParamKeys.Other) => {
  const { searchParameters: allSearchParameters, setSearchParameters: setAllSearchParameters } =
    useContext(LabRequestContext);

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

  return { searchParameters, setSearchParameters };
};

const INITIAL_SEARCH_PARAMETERS = {
  [LabRequestSearchParamKeys.All]: {},
  [LabRequestSearchParamKeys.Finalised]: {},
  [LabRequestSearchParamKeys.Other]: {},
};

export const LabRequestProvider = ({ children }) => {
  const [searchParameters, setSearchParameters] = usePersistedSearchParameters(
    USER_PREFERENCES_KEYS.LAB_REQUEST_SEARCH_PARAMETERS,
    INITIAL_SEARCH_PARAMETERS,
  );

  return (
    <LabRequestContext.Provider value={{ searchParameters, setSearchParameters }}>
      {children}
    </LabRequestContext.Provider>
  );
};
