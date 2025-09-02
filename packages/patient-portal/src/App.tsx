import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { LoginView, RegistrationView, DashboardView, RequestLoginTokenView } from './views';
import { PublicRoute } from '@routes/PublicRoute';
import { PrivateRoute } from '@routes/PrivateRoute';

export const App = () => {
  return (
    <Router>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<RequestLoginTokenView />} />
          <Route path="/login-submit" element={<LoginView />} />
          {/* Users can only register with a generated token, as of current. */}
          <Route path="/register/:token" element={<RegistrationView />} />
        </Route>
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<DashboardView />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};
