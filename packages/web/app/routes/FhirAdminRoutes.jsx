import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FhirJobStatsView } from '../views';

export const FhirAdminRoutes = React.memo(() => (
  <Routes>
    <Route path="jobStats" element={<FhirJobStatsView />} />
    <Route path="*" element={<Navigate to="jobStats" replace />} />
  </Routes>
));
