import React from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { ImmunisationsView } from '../views/patients';

export const ImmunisationRoutes = React.memo(() => (
  <Routes>
    <Route path="all" element={<ImmunisationsView />} />
    <Route path="*" element={<Navigate to="all" replace />} />
  </Routes>
));
