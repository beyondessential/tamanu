import React from 'react';
import { Routes, Route, Navigate } from 'react-router';

import { NotActiveView } from '../views';

export const BillingRoutes = () => (
  <Routes>
    <Route index element={<NotActiveView />} />
    <Route path="draft" element={<NotActiveView />} />
    <Route path="all" element={<NotActiveView />} />
    <Route path="paid" element={<NotActiveView />} />
    <Route path="edit/new" element={<NotActiveView />} />
    <Route path="pricing" element={<NotActiveView />} />
    <Route path="pricing/imaging" element={<NotActiveView />} />
    <Route path="pricing/lab" element={<NotActiveView />} />
    <Route path="pricing/procedure" element={<NotActiveView />} />
    <Route path="pricing/ward" element={<NotActiveView />} />
    <Route path="pricing/profiles" element={<NotActiveView />} />
    <Route path="*" element={<Navigate to=".." replace />} />
  </Routes>
);
