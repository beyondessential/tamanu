import React, { memo } from 'react';
import styled from 'styled-components';

import { InfoPaneList } from './InfoPaneList';
import { CoreInfoDisplay } from './PatientCoreInfo';

import { AllergyForm, OngoingConditionForm } from '../forms';

const OngoingConditionDisplay = memo(({ patient }) => (
  <InfoPaneList
    patient={patient}
    title="Ongoing conditions"
    endpoint="condition"
    suggesterEndpoints={['practitioner']}
    items={patient.conditions.map(x => x.name)}
    Form={OngoingConditionForm}
  />
));

const AllergyDisplay = memo(({ patient }) => (
  <InfoPaneList
    patient={patient}
    title="Allergies"
    endpoint="allergies"
    suggesterEndpoints={['practitioner', 'allergy']}
    items={patient.allergies.map(x => x.name)}
    Form={AllergyForm}
  />
));

const FamilyHistoryDisplay = memo(() => <InfoPaneList title="Family history" items={[]} />);

const PatientIssuesDisplay = memo(() => <InfoPaneList title="Other patient isues" items={[]} />);

const Container = styled.div`
  background: #fff;
  height: 100vh;
  border-right: 1px solid #dedede;
`;

const ListsSection = styled.div`
  margin-top: 15px;
  padding: 20px;
`;

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
