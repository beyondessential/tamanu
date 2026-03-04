import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import {
  LoginView,
  RegistrationView,
  DashboardView,
  RequestLoginTokenView,
  SurveyView,
} from './views';
import { PublicRoute } from '@routes/PublicRoute';
import { PrivateRoute } from '@routes/PrivateRoute';

export const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PrivateRoute element={<DashboardView />} />} />
        <Route path="/survey/:surveyId" element={<PrivateRoute element={<SurveyView />} />} />
        <Route path="/login" element={<PublicRoute element={<RequestLoginTokenView />} />} />
        <Route path="/login-submit" element={<PublicRoute element={<LoginView />} />} />
        <Route path="/register/:token" element={<PublicRoute element={<RegistrationView />} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};
