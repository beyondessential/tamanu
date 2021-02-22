import React, { memo, useCallback, useState } from 'react';
import styled from 'styled-components';

import { Button } from './Button';
import { ButtonRow } from './ButtonRow';

import { InfoPaneList } from './InfoPaneList';
import { CoreInfoDisplay } from './PatientCoreInfo';
import { PatientAlert } from './PatientAlert';
import { PatientStickerLabelPage } from './PatientStickerLabel';

import {
  AllergyForm,
  OngoingConditionForm,
  FamilyHistoryForm,
  PatientCarePlanForm,
  PatientIssueForm,
} from '../forms';
import { DeathModal } from './DeathModal';
import { Colors } from '../constants';

import { PATIENT_ISSUE_TYPES } from 'shared/constants';
import { PatientCarePlanDetails } from './PatientCarePlanNotes';

const OngoingConditionDisplay = memo(({ patient, readonly }) => (
  <InfoPaneList
    patient={patient}
    readonly={readonly}
    title="Ongoing conditions"
    endpoint="ongoingCondition"
    suggesterEndpoints={['practitioner', 'icd10']}
    items={patient.conditions}
    Form={OngoingConditionForm}
    getName={({ condition, resolved }) =>
      resolved ? `${condition.name} (resolved)` : condition.name
    }
  />
));

const AllergyDisplay = memo(({ patient, readonly }) => (
  <InfoPaneList
    patient={patient}
    readonly={readonly}
    title="Allergies"
    endpoint="allergy"
    suggesterEndpoints={['practitioner', 'allergy']}
    items={patient.allergies}
    Form={AllergyForm}
    getName={allergy => allergy.allergy.name}
  />
));

const FamilyHistoryDisplay = memo(({ patient, readonly }) => (
  <InfoPaneList
    patient={patient}
    readonly={readonly}
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

const shouldShowIssueInWarningModal = ({ type }) => type === PATIENT_ISSUE_TYPES.WARNING;

const PatientIssuesDisplay = memo(({ patient, readonly }) => {
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
        readonly={readonly}
        title="Other patient issues"
        endpoint="patientIssue"
        items={sortedIssues}
        Form={PatientIssueForm}
        getName={issue => issue.note}
      />
    </React.Fragment>
  );
});

const CarePlanDisplay = memo(({ patient, readonly }) => (
  <InfoPaneList
    patient={patient}
    readonly={readonly}
    title="Care plans"
    endpoint="patientCarePlan"
    suggesterEndpoints={['practitioner', 'carePlan']}
    items={patient.carePlans}
    Form={PatientCarePlanForm}
    getName={({ disease }) => disease.name}
    behavior="modal"
    itemTitle="Care Plan"
    CustomEditForm={PatientCarePlanDetails}
    getEditFormName={({ disease }) => `Care Plan: ${disease.name}`}
  />
));

const Container = styled.div`
  background: ${Colors.white};
  min-height: 100vh;
  border-right: 1px solid ${Colors.outline};
`;

const ListsSection = styled.div`
  margin-top: 15px;
  padding: 20px;
`;

const RecordDeathSection = memo(({ patient, readonly }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), [setModalOpen]);
  const closeModal = useCallback(() => setModalOpen(false), [setModalOpen]);

  return (
    <React.Fragment>
      <Button variant="contained" color="primary" disabled={patient.death} onClick={openModal}>
        Record death
      </Button>
      <DeathModal disabled={readonly} open={isModalOpen} onClose={closeModal} patient={patient} />
    </React.Fragment>
  );
});

const Buttons = styled(ButtonRow)`
  margin-top: 30px;
`;

const InfoPaneLists = memo(props => (
  <ListsSection>
    <OngoingConditionDisplay {...props} />
    <AllergyDisplay {...props} />
    <FamilyHistoryDisplay {...props} />
    <PatientIssuesDisplay {...props} />
    <CarePlanDisplay {...props} />
    <Buttons>
      <PatientStickerLabelPage {...props} />
      <RecordDeathSection {...props} />
    </Buttons>
  </ListsSection>
));

export const PatientInfoPane = memo(({ patient, readonly }) => (
  <Container>
    <CoreInfoDisplay patient={patient} />
    <InfoPaneLists patient={patient} readonly={readonly} />
  </Container>
));
