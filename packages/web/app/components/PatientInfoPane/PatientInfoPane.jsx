import React, { memo, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { Button } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';
import { InfoPaneList } from './InfoPaneList';
import { CoreInfoDisplay } from './PatientCoreInfo';
import { PrintPatientDetailsModal } from '../PatientPrinting';
import {
  AllergyForm,
  FamilyHistoryForm,
  OngoingConditionForm,
  PatientCarePlanForm,
  PatientIssueForm,
} from '../../forms';
import { PatientProgramRegistryForm } from '../../views/programRegistry/PatientProgramRegistryForm';
import { ProgramRegistryListItem } from '../../views/programRegistry/ProgramRegistryListItem';
import { DeathModal } from '../DeathModal';
import { PatientCarePlanDetails } from './PatientCarePlanNotes';
import { useApi } from '../../api';
import { PANE_SECTION_IDS } from './paneSections';
import { RecordDeathSection } from '../RecordDeathSection';
import { TranslatedText, TranslatedReferenceData } from '../Translation';
import { useSettings } from '../../contexts/Settings';

const OngoingConditionDisplay = memo(({ patient, readonly }) => (
  <InfoPaneList
    patient={patient}
    readonly={readonly}
    id={PANE_SECTION_IDS.CONDITIONS}
    title={
      <TranslatedText
        stringId="patient.detailsSidebar.subheading.conditions"
        fallback="Ongoing conditions"
        data-testid="translatedtext-lt23"
      />
    }
    endpoint="ongoingCondition"
    getEndpoint={`patient/${patient.id}/conditions`}
    Form={OngoingConditionForm}
    getName={({ condition, resolved }) => {
      const { name } = condition;
      if (!resolved) return name;
      return (
        <TranslatedText
          stringId="ongoingCondition.resolved"
          fallback=":name (resolved)"
          replacements={{ name }}
          data-testid="translatedtext-hlax"
        />
      );
    }}
    data-testid="infopanelist-gx0r"
  />
));

const AllergyDisplay = memo(({ patient, readonly }) => (
  <InfoPaneList
    patient={patient}
    readonly={readonly}
    id={PANE_SECTION_IDS.ALLERGIES}
    title={
      <TranslatedText
        stringId="patient.detailsSidebar.subheading.allergies"
        fallback="Allergies"
        data-testid="translatedtext-cm29"
      />
    }
    endpoint="allergy"
    getEndpoint={`patient/${patient.id}/allergies`}
    Form={AllergyForm}
    getName={allergy => (
      <TranslatedReferenceData
        fallback={allergy.allergy.name}
        value={allergy.allergy.id}
        category="allergy"
        data-testid="translatedreferencedata-xx23"
      />
    )}
    data-testid="infopanelist-j1q8"
  />
));

const FamilyHistoryDisplay = memo(({ patient, readonly }) => (
  <InfoPaneList
    patient={patient}
    readonly={readonly}
    id={PANE_SECTION_IDS.FAMILY_HISTORY}
    title={
      <TranslatedText
        stringId="patient.detailsSidebar.subheading.familyHistory"
        fallback="Family history"
        data-testid="translatedtext-u77j"
      />
    }
    endpoint="familyHistory"
    getEndpoint={`patient/${patient.id}/familyHistory`}
    Form={FamilyHistoryForm}
    getName={historyItem => {
      const { name } = historyItem.diagnosis;
      const relation = historyItem.relationship;
      if (!relation) return name;
      return `${name} (${relation})`;
    }}
    data-testid="infopanelist-x70z"
  />
));

const PatientIssuesDisplay = memo(({ patient, readonly }) => (
  <InfoPaneList
    patient={patient}
    readonly={readonly}
    id={PANE_SECTION_IDS.ISSUES}
    title={
      <TranslatedText
        stringId="patient.detailsSidebar.subheading.issues"
        fallback="Other patient issues"
        data-testid="translatedtext-hyec"
      />
    }
    endpoint="patientIssue"
    getEndpoint={`patient/${patient.id}/issues`}
    Form={PatientIssueForm}
    getName={issue => issue.note}
    data-testid="infopanelist-2y30"
  />
));

const CarePlanDisplay = memo(({ patient, readonly }) => (
  <InfoPaneList
    patient={patient}
    readonly={readonly}
    id={PANE_SECTION_IDS.CARE_PLANS}
    title={
      <TranslatedText
        stringId="patient.detailsSidebar.subheading.carePlans"
        fallback="Care plans"
        data-testid="translatedtext-qyk7"
      />
    }
    endpoint="patientCarePlan"
    getEndpoint={`patient/${patient.id}/carePlans`}
    Form={PatientCarePlanForm}
    getName={({ carePlan }) => (
      <TranslatedReferenceData
        fallback={carePlan.name}
        value={carePlan.id}
        category="carePlan"
        data-testid="translatedreferencedata-k1sn"
      />
    )}
    behavior="modal"
    itemTitle={
      <TranslatedText
        stringId="carePlan.modal.create.title"
        fallback="Add care plan"
        data-testid="translatedtext-mjq7"
      />
    }
    CustomEditForm={PatientCarePlanDetails}
    getEditFormName={({ carePlan }) => (
      <>
        <TranslatedText
          stringId="carePlan.modal.edit.title"
          fallback="Care plan"
          data-testid="translatedtext-h78x"
        />
        :{' '}
        <TranslatedReferenceData
          fallback={carePlan.name}
          value={carePlan.id}
          category="carePlan"
          data-testid="translatedreferencedata-mc13"
        />
      </>
    )}
    data-testid="infopanelist-poja"
  />
));

const ProgramRegistryDisplay = memo(({ patient, readonly }) => (
  <InfoPaneList
    id={PANE_SECTION_IDS.PROGRAM_REGISTRY}
    patient={patient}
    readonly={readonly}
    title={
      <TranslatedText
        stringId="patient.detailsSidebar.subheading.programRegistry"
        fallback="Program registry"
        data-testid="translatedtext-90u8"
      />
    }
    endpoint={`patient/${patient.id}/programRegistration`}
    getEndpoint={`patient/${patient.id}/programRegistration`}
    Form={PatientProgramRegistryForm}
    ListItemComponent={ProgramRegistryListItem}
    behavior="modal"
    itemTitle={
      <TranslatedText
        stringId="programRegistry.modal.addProgramRegistry.title"
        fallback="Add program registry"
        data-testid="translatedtext-kzxg"
      />
    }
    getEditFormName={programRegistry => `Program registry: ${programRegistry.name}`}
    data-testid="infopanelist-rq17"
  />
));
const CauseOfDeathButton = memo(({ openModal }) => {
  return (
    <Button size="small" onClick={openModal} data-testid="cause-of-death-button">
      Cause of death
    </Button>
  );
});

const PrintSection = memo(({ patient }) => (
  <PrintPatientDetailsModal patient={patient} data-testid="printpatientdetailsmodal-dy3t" />
));

const Container = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  background: ${Colors.white};
  box-shadow: 1px 0 3px rgba(0, 0, 0, 0.1);
  z-index: 10;
  overflow: auto;
`;

const ListsSection = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 0 auto;
  padding: 5px 25px 25px 25px;
`;

const Buttons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const PatientInfoPane = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), [setModalOpen]);
  const closeModal = useCallback(() => setModalOpen(false), [setModalOpen]);
  const { getSetting } = useSettings();
  const patient = useSelector(state => state.patient);
  const api = useApi();
  const patientDeathsEnabled = getSetting('features.enablePatientDeaths');
  const { data: deathData, isFetching } = useQuery(
    ['patientDeathSummary', patient.id],
    () => api.get(`patient/${patient.id}/death`, {}, { showUnknownErrorToast: false }),
    { enabled: patientDeathsEnabled && !!patient.dateOfDeath },
  );

  const readonly = !!patient.dateOfDeath;
  const showRecordDeathActions = !isFetching && patientDeathsEnabled && !deathData?.isFinal;
  const showCauseOfDeathButton = showRecordDeathActions && Boolean(deathData);

  return (
    <Container data-testid="container-qhh8">
      <CoreInfoDisplay patient={patient} data-testid="coreinfodisplay-fxik" />
      <ListsSection data-testid="listssection-1frw">
        <OngoingConditionDisplay
          patient={patient}
          readonly={readonly}
          data-testid="ongoingconditiondisplay-q1ok"
        />
        <AllergyDisplay patient={patient} readonly={readonly} data-testid="allergydisplay-y46g" />
        <FamilyHistoryDisplay
          patient={patient}
          readonly={readonly}
          data-testid="familyhistorydisplay-qha4"
        />
        <PatientIssuesDisplay
          patient={patient}
          readonly={readonly}
          data-testid="patientissuesdisplay-llbu"
        />
        <CarePlanDisplay patient={patient} readonly={readonly} data-testid="careplandisplay-7hx3" />
        <ProgramRegistryDisplay
          patient={patient}
          readonly={readonly}
          data-testid="programregistrydisplay-4eu1"
        />
        <Buttons data-testid="buttons-hh6n">
          {showCauseOfDeathButton && (
            <CauseOfDeathButton openModal={openModal} data-testid="causeofdeathbutton-ow4w" />
          )}
          <PrintSection patient={patient} readonly={readonly} data-testid="printsection-yt3i" />
        </Buttons>
        {showRecordDeathActions && (
          <RecordDeathSection
            patient={patient}
            openDeathModal={openModal}
            data-testid="recorddeathsection-jeoi"
          />
        )}
      </ListsSection>
      {patientDeathsEnabled && (
        <DeathModal
          open={isModalOpen}
          onClose={closeModal}
          deathData={deathData}
          data-testid="deathmodal-12q9"
        />
      )}
    </Container>
  );
};
