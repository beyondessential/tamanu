import React from 'react';
import { Navigate, Outlet, useOutletContext } from 'react-router';
import { Box, Container, CircularProgress } from '@mui/material';
import { PageHeader } from '@components/PageHeader';
import { useCurrentUserQuery } from '@api/queries/useCurrentUserQuery';
import { type Patient } from '@tamanu/shared/schemas/patientPortal/responses/patient.schema';

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
  const currentUserQuery = useCurrentUserQuery();

  if (currentUserQuery.isPending) {
    return <CircularProgress />;
  }

  if (currentUserQuery.isError || !currentUserQuery.data) {
    return <Navigate to="/login" replace />;
  }

  return (
    <PrivatePageLayout>
      <Outlet context={currentUserQuery.data} />
    </PrivatePageLayout>
  );
};

export function useCurrentUser() {
  return useOutletContext<Patient>();
}
