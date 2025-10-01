import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { EditReportView } from '../views/administration/reports/EditReportView';
import { ReportsAdminView } from '../views';

export const ReportAdminRoutes = React.memo(() => (
  <Routes>
    <Route path=":reportId/versions/:versionId/edit" element={<EditReportView />} />
    <Route path="/" element={<ReportsAdminView />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
));
