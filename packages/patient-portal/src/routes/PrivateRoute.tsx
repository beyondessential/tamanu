import React from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@auth/useAuth';
import { Box, Container, CircularProgress } from '@mui/material';
import { PageHeader } from '../components/PageHeader';

const PrivatePageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box component="main" sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
      <PageHeader />
      <Container maxWidth="lg" sx={{ p: 1.25 }}>
        {children}
      </Container>
    </Box>
  );
};

export const PrivateRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <CircularProgress />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <PrivatePageLayout>
      <Outlet />
    </PrivatePageLayout>
  );
};
