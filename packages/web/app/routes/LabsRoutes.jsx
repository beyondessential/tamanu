import React from 'react';
import { Routes, Route, Navigate } from 'react-router';

import {
  LabRequestListingView,
  FinalisedLabRequestListingView,
} from '../views/LabRequestListingView';

// Targets are absolute: a relative target resolves against the matched path, so from a
// non-empty sub-path it appends instead of replacing, and redirects to itself forever.
export const LabsRoutes = React.memo(() => (
  <Routes>
    <Route path="all" element={<LabRequestListingView />} />
    <Route path="finalised" element={<FinalisedLabRequestListingView />} />
    <Route path="published" element={<Navigate to="/lab-requests/finalised" replace />} />
    <Route path="*" element={<Navigate to="/lab-requests/all" replace />} />
  </Routes>
));
