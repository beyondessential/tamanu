import React from 'react';
import { styled } from '@mui/material/styles';
import { Navigate, Outlet } from 'react-router';
import { CircularProgress, Paper, Box } from '@mui/material';
import { useCurrentUserQuery } from '@api/queries/useCurrentUserQuery';

const PageContainer = styled(Box)`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 70px;
  height: 100vh;
  width: 100vw;
  justify-content: center;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.5) 20.19%, rgba(17, 114, 209, 0.3) 99.94%), #FFFFFF;
`;

const Card = styled(Paper)`
  margin: 6.25rem auto;
  display: block;
  padding: 1.875rem;
  min-width: 18.75rem;
  width: 32.5rem;
  max-width: 100%;
  text-align: center;
  box-shadow: none;
  border: none;
`;

import tamanuLogoBlue from '../assets/images/tamanu_logo_blue.svg';

const TamanuLogo = styled('img')`
  position: absolute;
  width: 193px;
  height: 60px;
  left: calc(50% - 193px/2 - 0.5px);
  top: 70px;
`;


const PublicPageLayout = ({ children }: { children: React.ReactNode }) => (
  <PageContainer>
    <TamanuLogo src={tamanuLogoBlue} alt="Tamanu Logo" />
    <Card>{children}</Card>
  </PageContainer>
);

export const PublicRoute = () => {
  const { data: user, isPending } = useCurrentUserQuery();

  if (isPending) {
    return <CircularProgress />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <PublicPageLayout>
      <Outlet />
    </PublicPageLayout>
  );
};
