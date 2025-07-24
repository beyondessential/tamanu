import React from 'react';
import { Navigate, Outlet } from 'react-router';

import { useAuth } from '@auth/useAuth';
import { CircularProgress } from '@mui/material';

export const PrivateRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <CircularProgress />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
