import React from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Colors } from '../constants';
import { LogoDark } from '../components/Logo';
import { PatientPortalFormStatusChip } from '../components/PatientPortalFormStatusChip';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../api';

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

const FormList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${Colors.backgroundGrey};
  }
`;

const FormTitle = styled.h2`
  font-size: 16px;
  font-weight: 400;
  color: ${Colors.darkestText};
  margin: 0;
`;

const OutstandingCount = styled.h1`
  color: ${Colors.darkestText};
  font-size: 15px;
  font-weight: 400;
  margin: 0 0 24px 0;
`;

const WaveEmoji = () => (
  <span role="img" aria-label="wave">
    👋
  </span>
);

export const PatientPortalView = () => {
  const { patientId } = useParams();
  const api = useApi();
  const { data: patient } = useQuery(
    ['patient-portal', patientId],
    () => api.get(`patient/${encodeURIComponent(patientId)}`)
  )

  const {data: encounter} = useQuery(
    ['encounter', patientId],
    () => api.get(`patient/${encodeURIComponent(patientId)}/encounters`),
    {
      select: (data) => {
        return data.data[0]
      }
    }
  )

  const patientName = patient?.firstName
  // Placeholder form data - this should come from your API
  const forms = [
    {
      id: 1,
      title: 'General pre-admission patient form',
      status: 'outstanding'
    },
    {
      id: 2,
      title: 'Exiting condition pre-admission form',
      status: 'completed'
    }
  ];

  const outstandingForms = forms.filter(form => form.status === 'outstanding');

  return (
    <Container>
      <Header>
        <LogoContainer>
          <LogoDark height="30" />
        </LogoContainer>
        <WelcomeContainer>
          <WelcomeText>
            Welcome to Tamanu  <span>{patientName}</span> <WaveEmoji />
          </WelcomeText>
        </WelcomeContainer>
      </Header>
      <Content>
        <OutstandingCount>
          You have {outstandingForms.length} outstanding {outstandingForms.length === 1 ? 'item' : 'items'} to complete
        </OutstandingCount>
        <FormList>
          {forms.map(form => (
            <FormItem key={form.id}>
              <FormTitle>{form.title}</FormTitle>
              <PatientPortalFormStatusChip status={form.status} />
            </FormItem>
          ))}
        </FormList>
      </Content>
    </Container>
  );
};
