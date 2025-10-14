import React from 'react';
import { Routes, Route, Navigate } from 'react-router';

import { BedManagement } from '../views/facility/BedManagement';
import { ReportGenerator } from '../views/reports';

export const FacilityAdminRoutes = React.memo(() => (
  <Routes>
    <Route path="reports" element={<ReportGenerator />} />
    <Route path="bed-management" element={<BedManagement />} />
    <Route path="*" element={<Navigate to="bed-management" replace />} />
  </Routes>
));
