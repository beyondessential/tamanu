import { LargeBodyText } from './Typography';
import styled, { keyframes } from 'styled-components';
import { Colors } from '../constants';
import { TamanuLogoLeftIconBlue } from './TamanuLogo';
import { Typography } from '@material-ui/core';

const Container = styled.div`
  padding: 25px 35px;
  height: 100vh;
  background: ${Colors.white};
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 50px;
`;

const ErrorMessage = styled(Typography)`
  font-weight: 500;
  font-size: 38px;
  line-height: 32px;
`;

const ErrorDescription = styled(LargeBodyText)`
  margin-top: 20px;
  max-width: 450px;
  text-align: center;
`;

const Logo = styled(TamanuLogoLeftIconBlue)`
  cursor: pointer;
`;

export const StatusPage = ({ message, description }) => {
  const handleRefreshPage = () => {
    window.location.reload();
  };
  return (
    <Container>
      <Logo onClick={handleRefreshPage} />
      <Content>
        <ErrorMessage>{message}</ErrorMessage>
        <ErrorDescription color="textTertiary">{description}</ErrorDescription>
      </Content>
    </Container>
  );
};

const ellipsis = keyframes`
to {
  width: 1.25em;
}
`;

const EllipsisContainer = styled.span`
  width: 353px;
  display: block;
  &:after {
    overflow: hidden;
    display: inline-block;
    vertical-align: bottom;
    animation: ${ellipsis} steps(4, end) 900ms infinite;
    content: '...'; /* ascii code for the ellipsis character */
    width: 0px;
  }
`;

export const LoadingStatusPage = () => (
  <StatusPage
    message={<EllipsisContainer>Tamanu is loading</EllipsisContainer>}
    description="Tamanu is currently loading. Please do not navigate away from this page."
  />
);

export const UnavailableStatusPage = () => (
  <StatusPage
    message="Tamanu is currently unavailable"
    description="Tamanu is currently unavailable. Please try again later or contact your system administrator for further information."
  />
);
