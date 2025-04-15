import React from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Colors } from '../constants';
import { LogoDark } from '../components/Logo';
import { TranslatedText } from '../components/Translation/TranslatedText';

const Container = styled.div`
  min-height: 100vh;
  background: ${Colors.white};
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  background: ${Colors.white};
  padding: 20px 26px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
`;

const WelcomeContainer = styled.div`
  background: ${Colors.white};
  border-radius: 4px;
  padding: 12px 16px;
  margin-bottom: 8px;
`;

const WelcomeText = styled.h1`
  color: ${Colors.darkestText};
  font-size: 20px;
  font-weight: 500;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;

  span {
    font-weight: 400;
  }
`;

const Content = styled.div`
  flex: 1;
  padding: 24px 26px;
  background: ${Colors.white};
  margin-top: -20px;
`;

const WaveEmoji = () => (
  <span role="img" aria-label="wave">
    👋
  </span>
);

export const PatientPortalView = () => {
  const { patientId } = useParams();
  // TODO: Fetch patient name from API using patientId
  const patientName = 'Jessie'; // Placeholder until we implement the API call

  return (
    <Container>
      <Header>
        <LogoContainer>
          <LogoDark height="30" />
        </LogoContainer>
        <WelcomeContainer>
          <WelcomeText>
            Welcome to Tamanu <span>{patientName}</span> <WaveEmoji />
          </WelcomeText>
        </WelcomeContainer>
      </Header>
      <Content>{/* Add your patient portal content here */}</Content>
    </Container>
  );
};
