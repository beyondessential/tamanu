import React, { memo, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { OutlinedButton } from '../Button';
import { InfoPaneList } from './InfoPaneList';
import { CoreInfoDisplay } from './PatientCoreInfo';
import { PatientPrintDetailsModal } from '../PatientPrinting';
import {
  AllergyForm,
  OngoingConditionForm,
  FamilyHistoryForm,
  PatientCarePlanForm,
  PatientIssueForm,
} from '../../forms';
import { DeathModal } from '../DeathModal';
import { Colors } from '../../constants';
import { PatientCarePlanDetails } from './PatientCarePlanNotes';
import { useLocalisation } from '../../contexts/Localisation';

const OngoingConditionDisplay = memo(({ patient, readonly }) => (
  <InfoPaneList
    patient={patient}
    readonly={readonly}
    title="Ongoing conditions"
    endpoint="ongoingCondition"
    getEndpoint={`patient/${patient.id}/conditions`}
    suggesters={{ practitioner: {}, icd10: {} }}
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
    getEndpoint={`patient/${patient.id}/allergies`}
    suggesters={{ practitioner: {}, allergy: {} }}
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
    getEndpoint={`patient/${patient.id}/familyHistory`}
    suggesters={{ practitioner: {}, icd10: {} }}
    Form={FamilyHistoryForm}
    getName={historyItem => {
      const { name } = historyItem.diagnosis;
      const relation = historyItem.relationship;
      if (!relation) return name;
      return `${name} (${relation})`;
    }}
  />
));

const PatientIssuesDisplay = memo(({ patient, readonly }) => (
  <InfoPaneList
    patient={patient}
    readonly={readonly}
    title="Other patient issues"
    endpoint="patientIssue"
    getEndpoint={`patient/${patient.id}/issues`}
    Form={PatientIssueForm}
    getName={issue => issue.note}
    isIssuesPane
  />
));

const CarePlanDisplay = memo(({ patient, readonly }) => (
  <InfoPaneList
    patient={patient}
    readonly={readonly}
    title="Care plans"
    endpoint="patientCarePlan"
    getEndpoint={`patient/${patient.id}/carePlans`}
    suggesters={{
      practitioner: {},
      carePlan: {
        filterer: ({ code }) => !patient.carePlans.some(c => c.carePlan.code === code),
      },
    }}
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
  box-shadow: 1px 0 3px rgba(0, 0, 0, 0.1);
  z-index: 10;
  overflow: auto;
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

export const PatientInfoPane = () => {
  const { getLocalisation } = useLocalisation();
  const patient = useSelector(state => state.patient);
  const readonly = !!patient.death;
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
};
