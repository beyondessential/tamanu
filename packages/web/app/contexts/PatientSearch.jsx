import React, { createContext, useCallback, useContext, useEffect } from 'react';
import { USER_PREFERENCES_KEYS } from '@tamanu/constants';

import { usePersistedSearchParameters } from '../hooks/usePersistedSearchParameters';

const PatientSearchContext = createContext({});

export const PatientSearchKeys = {
  AdmittedPatientsView: 'AdmittedPatientsView',
  OutpatientsView: 'OutpatientsView',
  BedManagementView: 'BedManagementView',
  TriageListingView: 'TriageListingView',
  RecentlyDischargedPatientsView: 'RecentlyDischargedPatientsView',
};

/**
 * Hook to set and retrieve patient search parameters
 * @param {string} key - namespace key, to allow multiple search boxes
 */
export const usePatientSearch = key => {
  if (!PatientSearchKeys[key]) {
    // since `key` is intended to be a constant, it should never be an unknown value
    // this is an exceptional case
    throw new Error('Invalid key passed to usePatientSearch, use PatientSearchKey');
  }
  const { allSearchParameters, setAllSearchParameters } = useContext(PatientSearchContext);
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
  useEffect(() => {
    if (!searchParameters) {
      setSearchParameters({});
    }
  }, [searchParameters, setSearchParameters]);
  return {
    searchParameters,
    setSearchParameters,
  };
};

const INITIAL_SEARCH_PARAMETERS = {};

export const PatientSearchProvider = ({ children }) => {
  const [allSearchParameters, setAllSearchParameters] = usePersistedSearchParameters(
    USER_PREFERENCES_KEYS.PATIENT_SEARCH_PARAMETERS,
    INITIAL_SEARCH_PARAMETERS,
  );

  return (
    <PatientSearchContext.Provider
      value={{
        allSearchParameters,
        setAllSearchParameters,
      }}
    >
      {children}
    </PatientSearchContext.Provider>
  );
};
