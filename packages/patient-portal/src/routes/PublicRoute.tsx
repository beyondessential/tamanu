import React from 'react';
import { styled } from '@mui/material/styles';
import { Navigate, Outlet } from 'react-router';
import { CircularProgress, Paper, Container, Box } from '@mui/material';
import { useCurrentUserQuery } from '@api/queries/useCurrentUserQuery';

const PageContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 50px;
  height: 100vh;
  justify-content: center;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(17, 114, 209, 0.2) 100%);
`;

const Card = styled(Paper)`
  margin: 100px auto;
  display: block;
  padding: 30px;
  min-width: 300px;
  width: 500px;
  max-width: 100%;
  text-align: center;
  box-shadow: none;

  h1 {
    margin-bottom: 16px;
  }

  p {
    margin-bottom: 30px;
  }

  button {
    margin-top: 20px;
    margin-bottom: 20px;
  }
`;

import tamanuLogoBlue from '../assets/images/tamanu_logo_blue.svg';

const PublicPageLayout = ({ children }: { children: React.ReactNode }) => (
  <PageContainer maxWidth="md">
    <img src={tamanuLogoBlue} alt="Tamanu Logo" />
    <Card variant="outlined">{children}</Card>
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