import React, { memo, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
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
import {
  CONDITIONS_TITLE,
  ALLERGIES_TITLE,
  FAMILY_HISTORY_TITLE,
  ISSUES_TITLE,
  CARE_PLANS_TITLE,
} from './paneTitles';
import { useApi, isErrorUnknownAllow404s } from '../../api';
import { LoadingIndicator } from '../LoadingIndicator';
import { RecordDeathSection } from '../RecordDeathSection';

const OngoingConditionDisplay = memo(({ patient, readonly }) => (
  <InfoPaneList
    patient={patient}
    readonly={readonly}
    title={CONDITIONS_TITLE}
    endpoint="ongoingCondition"
    getEndpoint={`patient/${patient.id}/conditions`}
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
    title={ALLERGIES_TITLE}
    endpoint="allergy"
    getEndpoint={`patient/${patient.id}/allergies`}
    Form={AllergyForm}
    getName={allergy => allergy.allergy.name}
  />
));

const FamilyHistoryDisplay = memo(({ patient, readonly }) => (
  <InfoPaneList
    patient={patient}
    readonly={readonly}
    title={FAMILY_HISTORY_TITLE}
    endpoint="familyHistory"
    getEndpoint={`patient/${patient.id}/familyHistory`}
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
    title={ISSUES_TITLE}
    endpoint="patientIssue"
    getEndpoint={`patient/${patient.id}/issues`}
    Form={PatientIssueForm}
    getName={issue => issue.note}
  />
));

const CarePlanDisplay = memo(({ patient, readonly }) => (
  <InfoPaneList
    patient={patient}
    readonly={readonly}
    title={CARE_PLANS_TITLE}
    endpoint="patientCarePlan"
    getEndpoint={`patient/${patient.id}/carePlans`}
    Form={PatientCarePlanForm}
    getName={({ carePlan }) => carePlan.name}
    behavior="modal"
    itemTitle="Add care plan"
    CustomEditForm={PatientCarePlanDetails}
    getEditFormName={({ carePlan }) => `Care plan: ${carePlan.name}`}
  />
));

const CauseOfDeathButton = memo(({ openModal }) => {
  return (
    <OutlinedButton size="small" onClick={openModal}>
      Cause of death
    </OutlinedButton>
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
  padding: 5px 25px 25px 25px;
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
  const [isModalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), [setModalOpen]);
  const closeModal = useCallback(() => setModalOpen(false), [setModalOpen]);
  const { getLocalisation } = useLocalisation();
  const patient = useSelector(state => state.patient);
  const api = useApi();
  const { data: deathData, isLoading } = useQuery(['patientDeathSummary', patient.id], () =>
    api.get(`patient/${patient.id}/death`, {}, { isErrorUnknown: isErrorUnknownAllow404s }),
  );

  const readonly = !!patient.death;
  const patientDeathsEnabled = getLocalisation('features.enablePatientDeaths');
  const showRecordDeathActions = patientDeathsEnabled && !deathData?.isFinal;
  const showCauseOfDeathButton = showRecordDeathActions && Boolean(deathData);

  if (isLoading) return <LoadingIndicator />;

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
          {showCauseOfDeathButton && <CauseOfDeathButton openModal={openModal} />}
          <PrintSection patient={patient} readonly={readonly} />
        </Buttons>
        <Box mt={12} />
        {showRecordDeathActions && <RecordDeathSection patient={patient} openModal={openModal} />}
      </ListsSection>
      {patientDeathsEnabled && (
        <DeathModal open={isModalOpen} onClose={closeModal} deathData={deathData} />
      )}
    </Container>
  );
};
