import React from 'react';
import { Routes, Route, Navigate } from 'react-router';
import {
  CompletedImagingRequestListingView,
  ImagingRequestListingView,
} from '../views/ImagingRequestListingView';

export const ImagingRoutes = React.memo(() => (
  <Routes>
    <Route path="active" element={<ImagingRequestListingView />} />
    <Route path="completed" element={<CompletedImagingRequestListingView />} />
    <Route path="*" element={<Navigate to="active" replace />} />
  </Routes>
));
