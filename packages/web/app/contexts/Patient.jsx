import React, { createContext, useContext } from 'react';
import { useSelector } from 'react-redux';

// Create the context
const PatientContext = createContext({
  patient: null,
  loading: false,
  error: null,
});

// Provider component
export const PatientProvider = ({ children }) => {
  const patientFromStore = useSelector(state => state.patient);

  // Use the patient data from the Redux store
  const value = {
    patient: patientFromStore,
    loading: false,
    error: null,
  };

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
};

// Hook for consuming the context
export const usePatient = () => {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
};
