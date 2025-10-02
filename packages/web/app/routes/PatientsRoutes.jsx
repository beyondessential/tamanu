import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import {
  AdmittedPatientsView,
  OutpatientsView,
  PatientListingView,
  TriageListingView,
} from '../views';
import { PatientRoutes } from './PatientRoutes';

const CategoryComponent = () => {
  const { category } = useParams();
  console.log('category', category);

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

export const PatientsRoutes = () => (
  <Routes>
    {/* Parameterized route for category listings */}
    <Route path=":category" element={<CategoryComponent />} />

    {/* Individual patient routes */}
    <Route path=":category/:patientId/*" element={<PatientRoutes />} />

    {/* Fallbacks */}
    <Route path="" element={<Navigate to="all" replace />} />
    <Route path="*" element={<Navigate to="all" replace />} />
  </Routes>
);
