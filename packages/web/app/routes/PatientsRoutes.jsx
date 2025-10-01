import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { PATIENT_PATHS } from '../constants/patientPaths';
import {
  AdmittedPatientsView,
  OutpatientsView,
  PatientListingView,
  TriageListingView,
} from '../views';
import { PatientRoutes } from './PatientRoutes';

const CategoryView = () => {
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

export const PatientsRoutes = React.memo(() => (
  <Routes>
    <Route path={PATIENT_PATHS.PATIENT + '/*'} element={<PatientRoutes />} />
    <Route path={PATIENT_PATHS.CATEGORY} element={<CategoryView />} />
    <Route path="*" element={<Navigate to="/patients/all" replace />} />
  </Routes>
));
