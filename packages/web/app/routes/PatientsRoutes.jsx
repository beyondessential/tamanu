import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  AdmittedPatientsView,
  OutpatientsView,
  PatientListingView,
  TriageListingView,
} from '../views';
import { PatientRoutes } from './PatientRoutes';

export const PatientsRoutes = () => (
  <Routes>
    <Route path="all" element={<PatientListingView />} />
    <Route path="emergency" element={<TriageListingView />} />
    <Route path="inpatient" element={<AdmittedPatientsView />} />
    <Route path="outpatient" element={<OutpatientsView />} />

    {/* Individual patient routes */}
    <Route path=":category/:patientId/*" element={<PatientRoutes />} />

    {/* Fallbacks */}
    <Route path="" element={<Navigate to="all" replace />} />
    <Route path="*" element={<Navigate to="all" replace />} />
  </Routes>
);
