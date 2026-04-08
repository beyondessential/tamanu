import React from 'react';
import { Navigate, Route, Routes } from 'react-router';

import {
  ClinicalStatusesTable,
  ConditionsTable,
  RelatedConditionCategoriesTable,
} from './ManageProgramRegistriesTable';
import { ProgramRegistriesAdminView } from './ProgramRegistriesAdminView';

export const ManageProgramRegistriesRoutes = React.memo(() => (
  <Routes>
    <Route element={<ProgramRegistriesAdminView />}>
      <Route index element={<Navigate to="statuses" replace />} />
      <Route path="statuses" element={<ClinicalStatusesTable />} />
      <Route path="conditions" element={<ConditionsTable />} />
      <Route path="conditionCategories" element={<RelatedConditionCategoriesTable />} />
      <Route path="*" element={<Navigate to="statuses" replace />} />
    </Route>
  </Routes>
));
