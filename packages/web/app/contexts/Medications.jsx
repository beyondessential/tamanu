import React, { createContext, useCallback, useContext, useState } from 'react';
import { MEDICATIONS_SEARCH_KEYS } from '../constants/medication';

const MedicationsContext = createContext({});

// This key is used to store separate search parameters for the different kinds of medication tables
export const useMedicationsContext = (key = MEDICATIONS_SEARCH_KEYS.ACTIVE) => {
  const {
    searchParameters: allSearchParameters,
    setSearchParameters: setAllSearchParameters,
  } = useContext(MedicationsContext);

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

export const MedicationsProvider = ({ children }) => {
  const [searchParameters, setSearchParameters] = useState({
    [MEDICATIONS_SEARCH_KEYS.ACTIVE]: {},
    [MEDICATIONS_SEARCH_KEYS.DISPENSED]: {},
  });

  return (
    <MedicationsContext.Provider
      value={{
        searchParameters,
        setSearchParameters,
      }}
    >
      {children}
    </MedicationsContext.Provider>
  );
};
