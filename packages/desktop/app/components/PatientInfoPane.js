import React, { memo, useCallback, useState } from 'react';
import styled from 'styled-components';

import { Button } from './Button';
import { ButtonRow } from './ButtonRow';

import { InfoPaneList } from './InfoPaneList';
import { CoreInfoDisplay } from './PatientCoreInfo';
import { PatientAlert } from './PatientAlert';
import { PatientStickerLabelPage } from './PatientStickerLabel';

import { AllergyForm, OngoingConditionForm, FamilyHistoryForm, PatientIssueForm } from '../forms';
import { DeathModal } from './DeathModal';
import { Colors } from '../constants';

const OngoingConditionDisplay = memo(({ patient }) => (
  <InfoPaneList
    patient={patient}
    title="Ongoing conditions"
    endpoint="conditions"
    suggesterEndpoints={['practitioner', 'icd10']}
    items={patient.conditions}
    Form={OngoingConditionForm}
    getName={({ condition }) => condition.name}
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
    getName={historyItem => {
      const name = historyItem.diagnosis.name;
      const relation = historyItem.relationship;
      if (!relation) return name;
      return `${name} (${relation})`;
    }}
  />
));

const shouldShowIssueInWarningModal = ({ type }) => type === 'warning';

const PatientIssuesDisplay = memo(({ patient }) => {
  const { issues } = patient;
  const warnings = issues.filter(shouldShowIssueInWarningModal);
  const sortedIssues = [
    ...warnings,
    ...issues.filter(issue => !shouldShowIssueInWarningModal(issue)),
  ];

  return (
    <React.Fragment>
      <PatientAlert alerts={warnings} />
      <InfoPaneList
        patient={patient}
        title="Other patient issues"
        endpoint="issue"
        items={sortedIssues}
        Form={PatientIssueForm}
        getName={issue => issue.notes}
      />
    </React.Fragment>
  );
});

const Container = styled.div`
  background: ${Colors.white};
  min-height: 100vh;
  border-right: 1px solid ${Colors.outline};
`;

const ListsSection = styled.div`
  margin-top: 15px;
  padding: 20px;
`;

const RecordDeathSection = memo(({ patient }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), [setModalOpen]);
  const closeModal = useCallback(() => setModalOpen(false), [setModalOpen]);

  return (
    <React.Fragment>
      <Button variant="contained" color="primary" disabled={patient.death} onClick={openModal}>
        Record death
      </Button>
      <DeathModal open={isModalOpen} onClose={closeModal} patient={patient} />
    </React.Fragment>
  );
});

const InfoPaneLists = memo(({ patient }) => (
  <ListsSection>
    <OngoingConditionDisplay patient={patient} />
    <AllergyDisplay patient={patient} />
    <FamilyHistoryDisplay patient={patient} />
    <PatientIssuesDisplay patient={patient} />
    <ButtonRow>
      <PatientStickerLabelPage patient={patient} />
      <RecordDeathSection patient={patient} />
    </ButtonRow>
  </ListsSection>
));

export const PatientInfoPane = memo(({ patient }) => (
  <Container>
    <CoreInfoDisplay patient={patient} />
    <InfoPaneLists patient={patient} />
  </Container>
));
