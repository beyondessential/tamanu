import React, { useContext, createContext, useState } from 'react';

const PatientSearchParametersContext = createContext({});

export const usePatientSearchParameters = () => useContext(PatientSearchParametersContext);

export const PatientSearchParametersProvider = ({ children }) => {
  const [labResultParameters, setLabResultParameters] = useState({});

  return (
    <PatientSearchParametersContext.Provider
      value={{
        labResultParameters,
        setLabResultParameters,
      }}
    >
      {children}
    </PatientSearchParametersContext.Provider>
  );
};
