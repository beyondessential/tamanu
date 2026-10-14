import React, { createContext, useContext } from 'react';
import { Navigate, ScrollRestoration } from 'react-router';
import { PortalGlobalStyle, PortalRoot } from '@components/layout';
import { PageHeader } from './header/PageHeader';
import { PageLoading } from '@components/PageLoading';
import { useCurrentUserQuery } from '@api/queries/useCurrentUserQuery';
import { type PatientWithAdditionalData } from '@tamanu/shared/schemas/patientPortal';

const CurrentUserContext = createContext<PatientWithAdditionalData | undefined>(undefined);

/** The header, with each page laying out its own content beneath it. */
const PrivatePageLayout = ({ children }: { children: React.ReactNode }) => (
  <PortalRoot>
    <PortalGlobalStyle />
    {/* Each new page opens at its top, and going back returns to where the patient was */}
    <ScrollRestoration />
    <PageHeader />
    {children}
  </PortalRoot>
);

export const PrivateRoute = ({ element }: { element: React.ReactElement }) => {
  const { data: user, isError, isPending } = useCurrentUserQuery();

  if (isPending) {
    return <PageLoading />;
  }

  if (isError || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <CurrentUserContext.Provider value={user}>
      <PrivatePageLayout>{element}</PrivatePageLayout>
    </CurrentUserContext.Provider>
  );
};

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);
  if (context === undefined) {
    throw new Error('useCurrentUser must be used within a PrivateRoute');
  }
  return context;
}
