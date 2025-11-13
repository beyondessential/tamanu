import React from 'react';
import { Routes, Route, Navigate } from 'react-router';

import {
  LabRequestListingView,
  PublishedLabRequestListingView,
} from '../views/LabRequestListingView';

export const LabsRoutes = React.memo(() => (
  <Routes>
    <Route path="all" element={<LabRequestListingView />} />
    <Route path="published" element={<PublishedLabRequestListingView />} />
    <Route path="*" element={<Navigate to="all" replace />} />
  </Routes>
));
