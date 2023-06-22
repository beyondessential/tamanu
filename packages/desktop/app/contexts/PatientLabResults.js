import React, { useContext, createContext, useState, useCallback } from 'react';

const PatientLabResultsContext = createContext({});

export const usePatientLabResultsContext = () => {
  const { searchParameters, setSearchParameters } = useContext(PatientLabResultsContext);

  const setSearchParametersData = useCallback(() => {
    setSearchParameters(searchParameters);
  }, [searchParameters, setSearchParameters]);

  return { searchParameters, setSearchParameters };
};

export const PatientLabResultsProvider = ({ children }) => {
  const [searchParameters, setSearchParameters] = useState({});

  const setSearchParametersData = data => {
    setSearchParameters(data);
  };

  return (
    <PatientLabResultsContext.Provider
      value={{
        searchParameters,
        setSearchParametersData,
      }}
    >
      {children}
    </PatientLabResultsContext.Provider>
  );
};
