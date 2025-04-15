import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useApi } from '../api';
import { LogoDark } from '../components/Logo';
import { PatientPortalFormList } from '../components/PatientPortalFormList';
import { PatientPortalKVCard } from '../components/PatientPortalKVCard';
import { Colors } from '../constants';

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

  const { data: patient } = useQuery(['patient-portal', patientId], () =>
    api.get(`patient/${encodeURIComponent(patientId)}`),
  );

  const { data: encounter } = useQuery(
    ['encounter', patientId],
    () => api.get(`patient/${encodeURIComponent(patientId)}/encounters`),
    {
      select: data => {
        return data.data[0];
      },
    },
  );

  const { data: allergies } = useQuery([`allergies`, patientId], () =>
    api.get(`patient/${encodeURIComponent(patientId)}/allergies`),
  );

  console.log(allergies)

  const patientName = patient?.firstName;
  // Placeholder form data - this should come from your API
  const forms = [
    {
      id: 'program-naurueye-nauexam',
      name: 'Eye Exams',
      status: 'outstanding',
    },
    {
      id: 'program-naurumch-nauinfass',
      name: 'Infant Assessment 0-2months',
      status: 'completed',
    },
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
            Welcome to Tamanu <span>{patientName}</span> <WaveEmoji />
          </WelcomeText>
        </WelcomeContainer>
      </Header>
      <Content>
        <OutstandingCount>
          You have {outstandingForms.length} outstanding{' '}
          {outstandingForms.length === 1 ? 'item' : 'items'} to complete
        </OutstandingCount>
        <PatientPortalFormList forms={forms} patientId={patientId} />
      {patient && (
        <PatientPortalKVCard
          dict={{
            'First Name': patient.firstName,
            'Last Name': patient.lastName,
            'Date of Birth': patient.dateOfBirth,
            Sex: patient.sex,
            'Patient ID': patient.displayId,
          }}
        />
      )}
      </Content>
    </Container>
  );
};
