import React, { memo } from 'react';
import styled from 'styled-components';

import { InfoPaneList } from './InfoPaneList';
import { CoreInfoDisplay } from './PatientCoreInfo';

import { AllergyForm, OngoingConditionForm, FamilyHistoryForm } from '../forms';
import { Colors } from '../constants';

const OngoingConditionDisplay = memo(({ patient }) => (
  <InfoPaneList
    patient={patient}
    title="Ongoing conditions"
    endpoint="condition"
    suggesterEndpoints={['practitioner']}
    items={patient.conditions}
    Form={OngoingConditionForm}
  />
));

const AllergyDisplay = memo(({ patient }) => (
  <InfoPaneList
    patient={patient}
    title="Allergies"
    endpoint="allergies"
    suggesterEndpoints={['practitioner', 'allergy']}
    items={patient.allergies}
    Form={AllergyForm}
    getName={allergy => allergy.allergy.name}
  />
));

const FamilyHistoryDisplay = memo(({ patient }) => (
  <InfoPaneList
    patient={patient}
    title="Family history"
    endpoint="familyHistory"
    suggesterEndpoints={['practitioner', 'icd10']}
    items={patient.familyHistory}
    Form={FamilyHistoryForm}
    getName={historyItem => historyItem.diagnosis.name}
  />
));

const PatientIssuesDisplay = memo(() => <InfoPaneList title="Other patient isues" items={[]} />);

const Container = styled.div`
  background: ${Colors.white};
  min-height: 100vh;
  border-right: 1px solid ${Colors.outline};
`;

const ListsSection = styled.div`
  margin-top: 15px;
  padding: 20px;
`;

const InfoPaneLists = memo(({ patient }) => (
  <ListsSection>
    <OngoingConditionDisplay patient={patient} />
    <AllergyDisplay patient={patient} />
    <FamilyHistoryDisplay patient={patient} />
  </ListsSection>
));

export const PatientInfoPane = memo(({ patient }) => (
  <Container>
    <CoreInfoDisplay patient={patient} />
    <InfoPaneLists patient={patient} />
  </Container>
));
