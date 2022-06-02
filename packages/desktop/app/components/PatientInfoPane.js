import React, { memo, useCallback, useState } from 'react';
import styled from 'styled-components';

import { PATIENT_ISSUE_TYPES } from 'shared/constants';
import { OutlinedButton } from './Button';

import { InfoPaneList } from './InfoPaneList';
import { CoreInfoDisplay } from './PatientCoreInfo';
import { PatientAlert } from './PatientAlert';
import { PatientPrintDetailsModal } from './PatientPrinting';

import {
  AllergyForm,
  OngoingConditionForm,
  FamilyHistoryForm,
  PatientCarePlanForm,
  PatientIssueForm,
} from '../forms';
import { DeathModal } from './DeathModal';
import { Colors } from '../constants';

import { PatientCarePlanDetails } from './PatientCarePlanNotes';
import { useLocalisation } from '../contexts/Localisation';

const OngoingConditionDisplay = memo(({ patient, readonly }) => (
  <InfoPaneList
    patient={patient}
    readonly={readonly}
    title="Ongoing conditions"
    endpoint="ongoingCondition"
    suggesters={{ practitioner: {}, icd10: {} }}
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
    suggesters={{ practitioner: {}, allergy: {} }}
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
    suggesters={{ practitioner: {}, icd10: {} }}
    items={patient.familyHistory}
    Form={FamilyHistoryForm}
    getName={historyItem => {
      const { name } = historyItem.diagnosis;
      const relation = historyItem.relationship;
      if (!relation) return name;
      return `${name} (${relation})`;
    }}
  />
));

const shouldShowIssueInWarningModal = ({ type }) => type === PATIENT_ISSUE_TYPES.WARNING;

const PatientIssuesDisplay = memo(({ patient, readonly }) => {
  const { issues = [] } = patient;
  const warnings = issues.filter(shouldShowIssueInWarningModal);
  const sortedIssues = [
    ...warnings,
    ...issues.filter(issue => !shouldShowIssueInWarningModal(issue)),
  ];

  return (
    <>
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
    </>
  );
});

const CarePlanDisplay = memo(({ patient, readonly }) => (
  <InfoPaneList
    patient={patient}
    readonly={readonly}
    title="Care plans"
    endpoint="patientCarePlan"
    suggesters={{
      practitioner: {},
      carePlan: {
        filterer: ({ code }) => !patient.carePlans.some(c => c.carePlan.code === code),
      },
    }}
    items={patient.carePlans}
    Form={PatientCarePlanForm}
    getName={({ carePlan }) => carePlan.name}
    behavior="modal"
    itemTitle="Add care plan"
    CustomEditForm={PatientCarePlanDetails}
    getEditFormName={({ carePlan }) => `Care plan: ${carePlan.name}`}
  />
));

const RecordDeathSection = memo(({ patient, readonly }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), [setModalOpen]);
  const closeModal = useCallback(() => setModalOpen(false), [setModalOpen]);

  return (
    <>
      <OutlinedButton disabled={!!patient.dateOfDeath || readonly} onClick={openModal}>
        Record death
      </OutlinedButton>
      <DeathModal disabled={readonly} open={isModalOpen} onClose={closeModal} patient={patient} />
    </>
  );
});

const PrintSection = memo(({ patient }) => <PatientPrintDetailsModal patient={patient} />);

const Container = styled.div`
  position: relative;
  background: ${Colors.white};
  min-height: 100vh;
  box-shadow: 1px 0 3px rgba(0, 0, 0, 0.1);
  z-index: 10;
`;

const ListsSection = styled.div`
  padding: 5px 25px;
`;

const Buttons = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;

  > button {
    margin-right: 10px;

    &:last-child {
      margin: 0;
    }
  }
`;

export const PatientInfoPane = memo(({ patient, readonly }) => {
  const { getLocalisation } = useLocalisation();
  const patientDeathsEnabled = getLocalisation('features.enablePatientDeaths');

  return (
    <Container>
      <CoreInfoDisplay patient={patient} />
      <ListsSection>
        <OngoingConditionDisplay patient={patient} readonly={readonly} />
        <AllergyDisplay patient={patient} readonly={readonly} />
        <FamilyHistoryDisplay patient={patient} readonly={readonly} />
        <PatientIssuesDisplay patient={patient} readonly={readonly} />
        <CarePlanDisplay patient={patient} readonly={readonly} />
        <Buttons>
          {patientDeathsEnabled && <RecordDeathSection patient={patient} readonly={readonly} />}
          <PrintSection patient={patient} readonly={readonly} />
        </Buttons>
      </ListsSection>
    </Container>
  );
});
