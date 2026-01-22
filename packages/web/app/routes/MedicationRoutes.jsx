import React from 'react';
import { Routes, Route, Navigate } from 'react-router';

import { MedicationRequestListingView } from '../views/MedicationRequestListingView';
import { MedicationDispenseListingView } from '../views/MedicationDispenseListingView';

export const MedicationRoutes = React.memo(() => (
  <Routes>
    <Route path="active" element={<MedicationRequestListingView />} />
    <Route path="dispensed" element={<MedicationDispenseListingView />} />
    <Route path="*" element={<Navigate to="active" replace />} />
  </Routes>
));
