import React from 'react';
import { Routes, Route, Navigate } from 'react-router';

import { MedicationRequestListingView } from '../views/MedicationRequestListingView';

export const MedicationRoutes = React.memo(() => (
  <Routes>
    <Route path="active" element={<MedicationRequestListingView />} />
    <Route path="dispensed" element={null} />
    <Route path="*" element={<Navigate to="active" replace />} />
  </Routes>
));
