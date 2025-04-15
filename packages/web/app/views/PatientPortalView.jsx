import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useApi } from '../api';
import { LoadingIndicator } from '../components/LoadingIndicator';
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

const Content = styled.main`
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

const Details = styled.details`
  padding-block: 1rem;
  padding-inline: 0.5rem;
`;

const Summary = styled.summary`
  color: #666;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.3;

  &::marker {
    content: '';
  }

  &::after {
    content: '';
    background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMS40Njk3IDcuNzE5NjdDMTEuNzYyNiA3LjQyNjc4IDEyLjIzNzQgNy40MjY3OCAxMi41MzAzIDcuNzE5NjdMMjAuMDMwMyAxNS4yMTk3QzIwLjMyMzIgMTUuNTEyNiAyMC4zMjMyIDE1Ljk4NzQgMjAuMDMwMyAxNi4yODAzQzE5LjczNzQgMTYuNTczMiAxOS4yNjI2IDE2LjU3MzIgMTguOTY5NyAxNi4yODAzTDEyIDkuMzEwNjZMNS4wMzAzMyAxNi4yODAzQzQuNzM3NDQgMTYuNTczMiA0LjI2MjU2IDE2LjU3MzIgMy45Njk2NyAxNi4yODAzQzMuNjc2NzggMTUuOTg3NCAzLjY3Njc4IDE1LjUxMjYgMy45Njk2NyAxNS4yMTk3TDExLjQ2OTcgNy43MTk2N1oiIGZpbGw9IiM2NjY2NjYiIHN0cm9rZT0iIzY2NjY2NiIgc3Ryb2tlLXdpZHRoPSIwLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K');
    height: 1em;
    width: 1em;

    @supports not (anchor-name: none) {
      inset-block-start: 50%;
      inset-inline-end: 0;
    }
    @supports (anchor-name: none) {
      position-anchor: --summary;
      position-area: center end;
      position: absolute;
    }
  }

  details[open] &::after {
    transform: rotate(0.5turn);
  }
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

  const { data: encounter, isLoading: isEncounterLoading } = useQuery(
    ['encounter', patientId],
    () => api.get(`patient/${encodeURIComponent(patientId)}/encounters`),
    {
      select: data => {
        return data.data[0];
      },
    },
  );

  const { data: allergyNames = [] } = useQuery(
    [`allergies`, patientId],
    () => api.get(`patient/${encodeURIComponent(patientId)}/allergies`),
    {
      select: data => {
        return data.data.map(({ allergy }) => allergy.name);
      },
    },
  );

  const { data: ongoingConditionNames = [] } = useQuery(
    [`condition`, patientId],
    () => api.get(`patient/${encodeURIComponent(patientId)}/conditions`),
    {
      select: data => {
        return data.data.map(({ condition }) => condition.name);
      },
    },
  );

  const { data: medications = [] } = useQuery(
    [`medications`, patientId],
    () => api.get(`encounter/${encounter?.id}/medications`),
    {
      select: data => {
        return data.data;
      },
      enabled: !!encounter,
    },
  );

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

  if (isEncounterLoading) {
    return <LoadingIndicator />;
  }

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
        <PatientPortalFormList forms={forms} patientId={patientId} encounterId={encounter?.id} />

        <Details>
          <Summary>Patient details</Summary>
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
        </Details>

        <Details>
          <Summary>Ongoing conditions</Summary>
          <ul>
            {ongoingConditionNames.map(name => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </Details>

        <Details>
          <Summary>Allergies</Summary>
          <ul>
            {allergyNames.map(name => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </Details>

        <Details>
          <summary>Medications</summary>
          {medications.map((medication, i) => (
            <PatientPortalKVCard
              dict={{
                Medication: medication.medication.name,
                Dose: medication.quantity,
                Frequency: medication.qtyMorning,
                Route: medication.route,
                'Date Started': medication.date,
                Prescriber: medication.prescriber.displayName,
              }}
              key={i}
            />
          ))}
        </Details>

        <Details>
          <Summary>Vaccinations</Summary>
          Here be vaccine things
        </Details>
      </Content>
    </Container>
  );
};
