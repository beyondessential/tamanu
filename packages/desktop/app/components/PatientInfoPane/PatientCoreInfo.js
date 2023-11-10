import React, { memo } from 'react';
import styled from 'styled-components';
import { Button, Typography } from '@material-ui/core';
import { LocalisedText } from '../LocalisedText';
import { DateDisplay } from '../DateDisplay';
import { PatientInitialsIcon } from '../PatientInitialsIcon';
import { Colors } from '../../constants';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { getDisplayAge } from '../../utils/dateTime';
import { useLocalisation } from '../../contexts/Localisation';
import { TranslatedText } from '../Translation/TranslatedText';

const PatientButton = styled(Button)`
  display: block;
  width: 100%;
  padding: 25px 35px 35px 25px;
  text-align: left;

  &:hover {
    background: #f4f9ff;
  }
`;

const NameHeader = styled(Typography)`
  align-self: flex-start;
  color: ${props => props.theme.palette.text.tertiary};
  font-size: 11px;
  line-height: 15px;
  margin-bottom: 20px;
`;

const NameText = styled(Typography)`
  font-size: 24px;
  line-height: 32px;
  text-transform: capitalize;
`;

const NameContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CoreInfoSection = styled.div`
  display: grid;
  grid-template-columns: 2fr 3.5fr;
  border-bottom: 1px solid ${Colors.softOutline};
  border-top: 1px solid ${Colors.softOutline};
  padding-left: 10px;
`;

const CoreInfoCellContainer = styled.div`
  :first-of-type {
    border-right: 1px solid ${Colors.softOutline};
  }

  padding: 10px 15px;
`;

const CoreInfoLabel = styled(Typography)`
  color: ${props => props.theme.palette.text.tertiary};
  font-size: 14px;
  line-height: 18px;
`;

const CoreInfoValue = styled(Typography)`
  color: ${props => props.theme.palette.text.secondary};
  font-size: 14px;
  line-height: 18px;
  font-weight: 500;
  text-transform: capitalize;
`;

const CoreInfoCell = ({ path, children, testId }) => (
  <CoreInfoCellContainer data-test-id={testId}>
    <CoreInfoLabel>
      <LocalisedText path={path} />
    </CoreInfoLabel>
    <CoreInfoValue>{children}</CoreInfoValue>
  </CoreInfoCellContainer>
);

const DeceasedText = styled.div`
  opacity: 0.8;
`;

const DeceasedIndicator = ({ death }) => (
  <DeceasedText>
    <span>
      <TranslatedText stringId="patient.detailsSidebar.deceasedIndicator" fallback="Deceased" />,
    </span>
    <DateDisplay date={death.date} />
  </DeceasedText>
);

const HealthIdContainer = styled.div`
  padding: 20px 10px 12px;
`;

const HealthId = styled.div`
  background: ${props => props.theme.palette.primary.main};
  color: ${Colors.white};
  font-weight: 600;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-radius: 3px;
`;

const HealthIdText = styled(Typography)`
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
`;

const AgeDisplay = styled.span`
  color: ${Colors.midText};
  font-size: 14px;
  font-weight: 400;
  text-transform: none;
`;

const HealthIdDisplay = ({ displayId }) => (
  <HealthIdContainer>
    <HealthId>
      <HealthIdText>
        <LocalisedText path="fields.displayId.longLabel" />
      </HealthIdText>
      <HealthIdText data-test-class="display-id-label">{displayId}</HealthIdText>
    </HealthId>
  </HealthIdContainer>
);

export const CoreInfoDisplay = memo(({ patient }) => {
  const { navigateToPatient } = usePatientNavigation();
  const { getLocalisation } = useLocalisation();
  const ageDisplayFormat = getLocalisation('ageDisplayFormat');

  return (
    <>
      <PatientButton onClick={() => navigateToPatient(patient.id)}>
        <NameHeader>
          <TranslatedText stringId="patient.detailsSidebar.title" fallback="Patient Details" />
        </NameHeader>
        <NameContainer>
          <div>
            <NameText data-test-id="core-info-patient-first-name">{patient.firstName}</NameText>
            <NameText data-test-id="core-info-patient-last-name">{patient.lastName}</NameText>
          </div>
          <PatientInitialsIcon patient={patient} />
          {patient.death && <DeceasedIndicator death={patient.death} />}
        </NameContainer>
      </PatientButton>
      <CoreInfoSection>
        <CoreInfoCell path="fields.sex.shortLabel" testId="core-info-patient-sex">
          {patient.sex}
        </CoreInfoCell>
        <CoreInfoCell path="fields.dateOfBirth.shortLabel" testId="core-info-patient-dob">
          <DateDisplay date={patient.dateOfBirth} />
          <AgeDisplay>{` (${getDisplayAge(patient.dateOfBirth, ageDisplayFormat)})`}</AgeDisplay>
        </CoreInfoCell>
      </CoreInfoSection>
      <HealthIdDisplay displayId={patient.displayId} />
    </>
  );
});
