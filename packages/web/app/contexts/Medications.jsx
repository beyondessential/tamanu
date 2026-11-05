import React, { createContext, useCallback, useContext } from 'react';
import { USER_PREFERENCES_KEYS } from '@tamanu/constants';

import { MEDICATIONS_SEARCH_KEYS } from '../constants/medication';
import { usePersistedSearchParameters } from '../hooks/usePersistedSearchParameters';

const MedicationsContext = createContext({});

// This key is used to store separate search parameters for the different kinds of medication tables
export const useMedicationsContext = (key = MEDICATIONS_SEARCH_KEYS.ACTIVE) => {
  const { searchParameters: allSearchParameters, setSearchParameters: setAllSearchParameters } =
    useContext(MedicationsContext);

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
  [MEDICATIONS_SEARCH_KEYS.ACTIVE]: {},
  [MEDICATIONS_SEARCH_KEYS.DISPENSED]: {},
};

export const MedicationsProvider = ({ children }) => {
  const [searchParameters, setSearchParameters] = usePersistedSearchParameters(
    USER_PREFERENCES_KEYS.MEDICATION_SEARCH_PARAMETERS,
    INITIAL_SEARCH_PARAMETERS,
  );

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
