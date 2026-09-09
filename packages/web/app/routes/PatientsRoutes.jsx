import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router';
import {
  AdmittedPatientsView,
  OutpatientsView,
  PatientListingView,
  TriageListingView,
} from '../views';
import { PatientRoutes } from './PatientRoutes';

const CategoryComponent = () => {
  const { category } = useParams();

  switch (category) {
    case 'all':
      return <PatientListingView />;
    case 'emergency':
      return <TriageListingView />;
    case 'inpatient':
      return <AdmittedPatientsView />;
    case 'outpatient':
      return <OutpatientsView />;
    default:
      return <Navigate to="/patients/all" replace />;
  }
};

// Key the whole patient shell by patientId so switching patients remounts it, resetting
// subtree state (selected tab, search parameter filters, local form state).
const KeyedPatientRoutes = () => {
  const { patientId } = useParams();
  return <PatientRoutes key={patientId} />;
};

export const PatientsRoutes = () => (
  <Routes>
    {/* Parameterized route for category listings */}
    <Route path=":category" element={<CategoryComponent />} />

    {/* Individual patient routes */}
    <Route path=":category/:patientId/*" element={<KeyedPatientRoutes />} />

    {/* Fallbacks */}
    <Route path="" element={<Navigate to="all" replace />} />
    <Route path="*" element={<Navigate to="all" replace />} />
  </Routes>
);
