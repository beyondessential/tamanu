import React from 'react';
import { Route } from 'react-router-dom';
import PatientPortal from '../views/patientPortal/PatientPortal';

const PatientPortalRoutes = () => {
  return <Route path="/patient-portal" element={<PatientPortal />} />;
};

export default PatientPortalRoutes;
