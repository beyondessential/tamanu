import React, { useContext, createContext, useState, useCallback, useEffect } from 'react';

const PatientSearchContext = createContext({});

/**
 * Hook to set and retrieve patient search parameters
 * @param {string} key - namespace key, to allow multiple search boxes
 */
export const usePatientSearch = key => {
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

export const PatientSearchProvider = ({ children }) => {
  const [allSearchParameters, setAllSearchParameters] = useState({});

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
