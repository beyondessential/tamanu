import React, { useContext, createContext, useState } from 'react';

const PatientLabResultsContext = createContext({});

export const usePatientLabResultsContext = () => {
  const { searchParameters, setSearchParameters } = useContext(PatientLabResultsContext);

  return { searchParameters, setSearchParameters };
};

export const PatientLabResultsProvider = ({ children }) => {
  const [searchParameters, setSearchParameters] = useState({});

  return (
    <PatientLabResultsContext.Provider
      value={{
        searchParameters,
        setSearchParameters,
      }}
    >
      {children}
    </PatientLabResultsContext.Provider>
  );
};
