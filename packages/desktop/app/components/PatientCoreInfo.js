import React, { memo } from 'react';
import styled from 'styled-components';
import { grey } from '@material-ui/core/colors';

import { useFlags } from '../contexts/FeatureFlags';
import { ConfigurableText } from './ConfigurableText';
import { DateDisplay } from './DateDisplay';
import { PatientInitialsIcon } from './PatientInitialsIcon';
import { Colors } from '../constants';
import { InvertedDisplayIdLabel } from './DisplayIdLabel';

const NameSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 20px;
  padding: 1rem;
`;

const NameHeader = styled.div`
  align-self: flex-start;
  color: grey;
  font-size: 14px;
  padding-bottom: 10px;
`;

const NameText = styled.span`
  font-size: 30px;
`;

const FirstNameRow = styled.span`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const NameContainer = styled.span`
  display: flex;
  flex-direction: column;
  align-self: flex-start;
  width: 100%;
`;

const CoreInfoSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid ${grey[300]};
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

const HealthIdContainer = styled.div`
  background: ${Colors.primary};
  color: ${Colors.secondary};
  font-weight: 600;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
`;

const HealthIdLabelText = styled.div`
  font-size: 12px;
`;

const CoreInfoCell = memo(({ flag, children }) => {
  const { getFlag } = useFlags();
  return (
    <CoreInfoCellContainer>
      <CoreInfoLabel>{getFlag(flag)}</CoreInfoLabel>
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

const HealthIdDisplay = memo(({ patient }) => (
  <HealthIdContainer>
    <HealthIdLabelText>
      <ConfigurableText flag="patientFieldOverrides.displayId.longLabel"/>
    </HealthIdLabelText>
    <InvertedDisplayIdLabel>{patient.displayId}</InvertedDisplayIdLabel>
  </HealthIdContainer>
));

export const CoreInfoDisplay = memo(({ patient }) => (
  <React.Fragment>
    <NameSection>
      <NameHeader>Patient Details</NameHeader>
      <NameContainer>
        <FirstNameRow>
          <NameText>{patient.firstName}</NameText>
          <PatientInitialsIcon patient={patient} />
        </FirstNameRow>
        <NameText>{patient.lastName}</NameText>
        {patient.death && <DeceasedIndicator death={patient.death} />}
      </NameContainer>
    </NameSection>
    <CoreInfoSection>
      <CoreInfoCell flag="patientFieldOverrides.sex.shortLabel">{patient.sex}</CoreInfoCell>
      <CoreInfoCell flag="patientFieldOverrides.dateOfBirth.shortLabel">
        <DateDisplay date={patient.dateOfBirth} />
      </CoreInfoCell>
    </CoreInfoSection>
    <HealthIdDisplay patient={patient} />
  </React.Fragment>
));
