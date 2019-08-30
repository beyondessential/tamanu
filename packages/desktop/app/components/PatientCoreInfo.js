import React, { memo } from 'react';
import styled from 'styled-components';

import { grey } from '@material-ui/core/colors';
import { DateDisplay } from './DateDisplay';
import { PatientInitialsIcon } from './PatientInitialsIcon';

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
`;

const HealthIdContainer = styled.div`
  background: #326699;
  color: #ffcc24;
  font-weight: 600;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
`;

const HealthIdLabel = styled.div`
  background: #ffcc24;
  color: #000;
  border-radius: 3px;
  padding: 5px;
  font-size: 14px;
  font-weight: bold;
`;

const HealthIdLabelText = styled.div`
  font-size: 12px;
`;

const CoreInfoCell = memo(({ label, children }) => (
  <CoreInfoCellContainer>
    <CoreInfoLabel>{label}</CoreInfoLabel>
    <CoreInfoValue>{children}</CoreInfoValue>
  </CoreInfoCellContainer>
));

const HealthIdDisplay = memo(({ patient }) => (
  <HealthIdContainer>
    <HealthIdLabelText>Health Identification Number</HealthIdLabelText>
    <HealthIdLabel>{patient.displayId}</HealthIdLabel>
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
      </NameContainer>
    </NameSection>
    <CoreInfoSection>
      <CoreInfoCell label="Sex">{patient.sex}</CoreInfoCell>
      <CoreInfoCell label="DOB">
        <DateDisplay date={patient.dateOfBirth} />
      </CoreInfoCell>
    </CoreInfoSection>
    <HealthIdDisplay patient={patient} />
  </React.Fragment>
));
