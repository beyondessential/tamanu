import React from 'react';
import { Navigate, Route, Routes } from 'react-router';

import { ProgramRegistriesAdminView } from './ProgramRegistriesAdminView';

export const ProgramRegistriesDetailAdminRoutes = React.memo(() => (
  <Routes>
    <Route element={<ProgramRegistriesAdminView />}>
      <Route index element={<Navigate to="statuses" replace />} />
      <Route path="statuses" element={<article>statuses</article>} />
      <Route path="conditions" element={<article>conditions</article>} />
      <Route path="conditionCategories" element={<article>conditionCategories</article>} />
      <Route path="*" element={<Navigate to="statuses" replace />} />
    </Route>
  </Routes>
));
