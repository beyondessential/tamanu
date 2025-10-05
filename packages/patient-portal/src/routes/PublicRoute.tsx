import React from 'react';
import { Navigate } from 'react-router';
import { styled } from '@mui/material/styles';
import { CircularProgress, Box } from '@mui/material';
import { useCurrentUserQuery } from '@api/queries/useCurrentUserQuery';
import tamanuLogoBlue from '../assets/images/tamanu_logo_blue.svg';
import { TAMANU_COLORS } from '@tamanu/ui-components';

const PageContainer = styled(Box)`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  width: 100vw;
  justify-content: center;
  background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.5) 0%,
      rgba(255, 255, 255, 0.485) 8.1%,
      rgba(253, 253, 255, 0.46) 15.5%,
      rgba(248, 248, 255, 0.425) 22.5%,
      rgba(240, 243, 255, 0.385) 29%,
      rgba(229, 237, 255, 0.345) 35.3%,
      rgba(215, 230, 255, 0.31) 41.2%,
      rgba(198, 222, 255, 0.28) 47.1%,
      rgba(178, 213, 255, 0.26) 52.9%,
      rgba(156, 203, 255, 0.25) 58.8%,
      rgba(132, 192, 255, 0.255) 64.7%,
      rgba(106, 180, 255, 0.27) 71%,
      rgba(79, 167, 252, 0.285) 77.5%,
      rgba(52, 153, 245, 0.305) 84.5%,
      rgba(26, 138, 235, 0.32) 91.9%,
      rgba(17, 114, 209, 0.3) 100%
    ),
    ${TAMANU_COLORS.white};
`;
const TamanuLogo = styled('img')`
  width: 160px;
  position: absolute;
  top: 64px;
`;

const PublicPageLayout = ({ children }: { children: React.ReactNode }) => (
  <PageContainer>
    <TamanuLogo src={tamanuLogoBlue} alt="Tamanu Logo" />
    {children}
  </PageContainer>
);

export const PublicRoute = ({ element }: { element: React.ReactElement }) => {
  const { data: user, isPending } = useCurrentUserQuery();

  if (isPending) {
    return <CircularProgress />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <PublicPageLayout>{element}</PublicPageLayout>;
};
