import React, { createContext, useContext, useMemo } from 'react';
import { useParams } from 'react-router';
import { usePatientDataQuery } from '../api/queries/usePatientDataQuery';

const PatientContext = createContext(null);

export const usePatient = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
};

// Owns "load the patient for the current route": reads patientId from the URL and
// resolves the patient via React Query, so the whole patient subtree reads from one source.
export const PatientProvider = ({ children }) => {
  const { patientId } = useParams();
  const { data: patient, isLoading, error, refetch } = usePatientDataQuery(patientId);

  const value = useMemo(
    () => ({ patientId, patient, isLoading, error, refetch }),
    [patientId, patient, isLoading, error, refetch],
  );

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
};
