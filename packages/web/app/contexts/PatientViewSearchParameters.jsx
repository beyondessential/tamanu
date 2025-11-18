import React, { createContext, useContext, useState } from 'react';

const PatientSearchParametersContext = createContext({});

export const usePatientSearchParameters = () => useContext(PatientSearchParametersContext);

export const PatientSearchParametersProvider = ({ children }) => {
  const [labResultParameters, setLabResultParameters] = useState({});
  const [patientHistoryParameters, setPatientHistoryParameters] = useState({});

  return (
    <PatientSearchParametersContext.Provider
      value={{
        labResultParameters,
        setLabResultParameters,
        patientHistoryParameters,
        setPatientHistoryParameters,
      }}
    >
      {children}
    </PatientSearchParametersContext.Provider>
  );
};
