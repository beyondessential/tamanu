import React from 'react';
import { Routes, Route, Navigate } from 'react-router';

import { TamanuReviewsView } from '../views/tamanuReviews/TamanuReviewsView';

export const TamanuReviewsRoutes = React.memo(() => (
  <Routes>
    <Route index element={<TamanuReviewsView />} />
    <Route path="*" element={<Navigate to=".." replace />} />
  </Routes>
));
