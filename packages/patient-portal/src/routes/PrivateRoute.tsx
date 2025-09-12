import React, { createContext, useContext } from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { Box, Container, CircularProgress } from '@mui/material';
import { PageHeader } from '@components/PageHeader';
import { useCurrentUserQuery } from '@api/queries/useCurrentUserQuery';
import { type PatientWithAdditionalData } from '@tamanu/shared/schemas/patientPortal';

const CurrentUserContext = createContext<PatientWithAdditionalData | undefined>(undefined);

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

export const PrivateRoute = (props: RouteProps) => {
  const { component: Component, ...restProps } = props;
  const { data: user, isError, isPending } = useCurrentUserQuery();

  return (
    <Route
      {...restProps}
      render={routeProps => {
        if (isPending) {
          return <CircularProgress />;
        }

        if (isError || !user) {
          return <Redirect to="/login" />;
        }

        return (
          <CurrentUserContext.Provider value={user}>
            <PrivatePageLayout>{Component && <Component {...routeProps} />}</PrivatePageLayout>
          </CurrentUserContext.Provider>
        );
      }}
    />
  );
};

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);
  if (context === undefined) {
    throw new Error('useCurrentUser must be used within a PrivateRoute');
  }
  return context;
}
