import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { LoginView, MainView, RegistrationView } from './views';

export const RoutingApp = React.memo(() => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* Users can only register with a generated token, as of current. */}
        <Route path="/register/:token" element={<RegistrationView />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="/main" element={<MainView />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
});
