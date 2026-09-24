import React from 'react';
import { Routes, Route, Navigate } from 'react-router';

import {
  LabRequestListingView,
  FinalisedLabRequestListingView,
} from '../views/LabRequestListingView';

export const LabsRoutes = React.memo(() => (
  <Routes>
    <Route path="all" element={<LabRequestListingView />} />
    <Route path="finalised" element={<FinalisedLabRequestListingView />} />
    <Route path="published" element={<Navigate to="finalised" replace />} />
    <Route path="*" element={<Navigate to="all" replace />} />
  </Routes>
));
