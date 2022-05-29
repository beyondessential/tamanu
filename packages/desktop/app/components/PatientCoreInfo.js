import React, { memo } from 'react';
import styled from 'styled-components';
import { grey } from '@material-ui/core/colors';
import { Typography } from '@material-ui/core';

import { useLocalisation } from '../contexts/Localisation';
import { LocalisedText } from './LocalisedText';
import { DateDisplay } from './DateDisplay';
import { PatientInitialsIcon } from './PatientInitialsIcon';
import { Colors } from '../constants';

const NameSection = styled.div`
  margin-bottom: 20px;
  padding: 1rem;
`;

const NameHeader = styled(Typography)`
  align-self: flex-start;
  color: ${props => props.theme.palette.text.tertiary};
  font-size: 11px;
  line-height: 15px;
  padding-bottom: 10px;
`;

const NameText = styled(Typography)`
  font-size: 24px;
  line-height: 32px;
`;

const NameContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CoreInfoSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid ${grey[300]};
  border-bottom: 1px solid ${grey[300]};
`;

const CoreInfoCellContainer = styled.div`
  :first-of-type {
    border-right: 1px solid ${grey[300]};
  }

  padding: 10px 10px;
`;

const CoreInfoLabel = styled.div`
  color: ${grey[400]};
  font-size: 14px;
`;

const CoreInfoValue = styled.div`
  color: ${grey[600]};
  font-size: 16px;
  margin-top: 5px;
  font-weight: bold;
  text-transform: capitalize;
`;

const CoreInfoCell = memo(({ path, children, testId }) => {
  const { getLocalisation } = useLocalisation();
  return (
    <CoreInfoCellContainer data-test-id={testId}>
      <CoreInfoLabel>{getLocalisation(path)}</CoreInfoLabel>
      <CoreInfoValue>{children}</CoreInfoValue>
    </CoreInfoCellContainer>
  );
});

const DeceasedText = styled.div`
  opacity: 0.8;
`;

const DeceasedIndicator = memo(({ death }) => (
  <DeceasedText>
    <span>Deceased, </span>
    <DateDisplay date={death.date} />
  </DeceasedText>
));

const HealthIdContainer = styled.div`
  padding: 15px 10px 10px;
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

export const CoreInfoDisplay = memo(({ patient }) => (
  <>
    <NameSection>
      <NameHeader>Patient Details</NameHeader>
      <NameContainer>
        <div>
          <NameText data-test-id="core-info-patient-first-name">{patient.firstName}</NameText>
          <NameText data-test-id="core-info-patient-last-name">{patient.lastName}</NameText>
        </div>
        <PatientInitialsIcon patient={patient} />
        {patient.death && <DeceasedIndicator death={patient.death} />}
      </NameContainer>
    </NameSection>
    <CoreInfoSection>
      <CoreInfoCell path="fields.sex.shortLabel" testId="core-info-patient-sex">
        {patient.sex}
      </CoreInfoCell>
      <CoreInfoCell path="fields.dateOfBirth.shortLabel" testId="core-info-patient-dob">
        <DateDisplay date={patient.dateOfBirth} />
      </CoreInfoCell>
    </CoreInfoSection>
    <HealthIdContainer>
      <HealthId>
        <HealthIdText>
          National Health Number
          {/*<LocalisedText path="fields.displayId.longLabel" />*/}
        </HealthIdText>
        <HealthIdText data-test-class="display-id-label">{patient.displayId}</HealthIdText>
      </HealthId>
    </HealthIdContainer>
  </>
));
