import React, { memo } from 'react';
import styled from 'styled-components';
import { grey } from '@material-ui/core/colors';

import { DateDisplay } from './DateDisplay';
import { InfoPaneList } from './InfoPaneList';
import { PatientInitialsIcon } from './PatientInitialsIcon';
import { AllergyForm, OngoingConditionForm } from '../forms';

const Container = styled.div`
  background: #fff;
  padding: 1rem;
  height: 100%;
`;

const NameSection = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
`;

const NameText = styled.span`
  font-size: 30px;
  margin-left: 10px;
`;

const CoreInfoSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
`;

const CoreInfoCellContainer = styled.div`
  border: 1px solid ${grey[300]};
  padding: 10px 0px;
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

const CoreInfoCell = memo(({ label, children }) => (
  <CoreInfoCellContainer>
    <CoreInfoLabel>{label}</CoreInfoLabel>
    <CoreInfoValue>{children}</CoreInfoValue>
  </CoreInfoCellContainer>
));

const HealthIdContainer = styled.div`
  background: #326699;
  color: #ffcc24;
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

const HealthIdDisplay = memo(({ patient }) => (
  <HealthIdContainer>
    <HealthIdLabelText>Health Identification Number</HealthIdLabelText>
    <HealthIdLabel>{patient.displayId}</HealthIdLabel>
  </HealthIdContainer>
));

const CoreInfoDisplay = memo(({ patient }) => (
  <React.Fragment>
    <NameSection>
      <PatientInitialsIcon patient={patient} />
      <NameText>{`${patient.firstName} ${patient.lastName}`}</NameText>
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

const ListsSection = styled.div`
  margin-top: 15px;
`;

const OngoingConditionDisplay = memo(({ patient }) => (
  <InfoPaneList
    title="Ongoing conditions"
    endpoint="condition"
    suggesterEndpoints={['practitioner']}
    items={patient.conditions.map(x => x.name)}
    Form={OngoingConditionForm}
  />
));

const AllergyDisplay = memo(({ patient }) => (
  <InfoPaneList
    title="Allergies"
    endpoint="allergy"
    suggesterEndpoints={['practitioner']}
    items={patient.allergies.map(x => x.name)}
    Form={AllergyForm}
  />
));

const FamilyHistoryDisplay = memo(() => <InfoPaneList title="Family history" items={[]} />);

const PatientIssuesDisplay = memo(() => <InfoPaneList title="Other patient isues" items={[]} />);

const InfoPaneLists = memo(({ patient }) => (
  <ListsSection>
    <OngoingConditionDisplay patient={patient} />
    <AllergyDisplay patient={patient} />
  </ListsSection>
));

export const PatientInfoPane = memo(({ patient }) => (
  <Container>
    <CoreInfoDisplay patient={patient} />
    <InfoPaneLists patient={patient} />
  </Container>
));
