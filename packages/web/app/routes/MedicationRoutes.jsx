import React from 'react';
import { Routes, Route, Navigate } from 'react-router';

import { MedicationListingView } from '../views/MedicationListingView';

export const MedicationRoutes = React.memo(() => (
  <Routes>
    <Route path="all" element={<MedicationListingView />} />
    <Route path="*" element={<Navigate to="all" replace />} />
  </Routes>
));
