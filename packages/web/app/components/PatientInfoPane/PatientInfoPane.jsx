import React, { memo, useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { Button } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';
import { InfoPaneList } from './InfoPaneList';
import { CoreInfoDisplay, HealthIdDisplay } from './PatientCoreInfo';
import { GreyPill, ResolvedPill } from './InfoPanePill';
import {
  AllergyDetails,
  FamilyHistoryDetails,
  OngoingConditionDetails,
  PatientIssueDetails,
} from './paneItemDetails';
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
import { AiPatientSummary } from '../AiPatientSummary';
import { useSettings } from '../../contexts/Settings';
import { useSyncState } from '../../contexts/SyncState';
import { useAuth } from '../../contexts/Auth';
import { usePatient } from '../../contexts/Patient';
import { route } from '@tamanu/api-client';

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
    getEndpoint={route('patient/:patientId/conditions', { patientId: patient.id })}
    Form={OngoingConditionForm}
    getName={({ condition }) => condition.name}
    getTag={({ resolved }) =>
      resolved && (
        <ResolvedPill data-testid="resolvedpill-condition">
          <TranslatedText stringId="conditions.resolved.label" fallback="Resolved" />
        </ResolvedPill>
      )
    }
    ItemDetails={OngoingConditionDetails}
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
    getEndpoint={route('patient/:patientId/allergies', { patientId: patient.id })}
    Form={AllergyForm}
    getName={allergy => (
      <TranslatedReferenceData
        fallback={allergy.allergy.name}
        value={allergy.allergy.id}
        category="allergy"
        data-testid="translatedreferencedata-xx23"
      />
    )}
    getTag={({ reaction }) =>
      reaction && (
        <GreyPill data-testid="reactionpill-allergy">
          <TranslatedReferenceData
            fallback={reaction.name}
            value={reaction.id}
            category="reaction"
          />
        </GreyPill>
      )
    }
    ItemDetails={AllergyDetails}
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
    getEndpoint={route('patient/:patientId/familyHistory', { patientId: patient.id })}
    Form={FamilyHistoryForm}
    getName={historyItem => {
      const { name } = historyItem.diagnosis;
      const relation = historyItem.relationship;
      if (!relation) return name;
      return `${name} (${relation})`;
    }}
    ItemDetails={FamilyHistoryDetails}
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
    getEndpoint={route('patient/:patientId/issues', { patientId: patient.id })}
    Form={PatientIssueForm}
    getName={issue => issue.note}
    ItemDetails={PatientIssueDetails}
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
    getEndpoint={route('patient/:patientId/carePlans', { patientId: patient.id })}
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
    endpoint={route('patient/:patientId/programRegistration', { patientId: patient.id })}
    getEndpoint={route('patient/:patientId/programRegistration', { patientId: patient.id })}
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
      <TranslatedText
        stringId="death.causeOfDeath.label"
        fallback="Cause of death"
        data-testid="translatedtext-h80z"
      />
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
  border-right: 1px solid ${Colors.outline};
  z-index: 10;
  overflow: auto;
`;

const ListsSection = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 0 auto;
  gap: 16px;
  padding: 16px;
`;

const Footer = styled.div`
  position: sticky;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  padding: 16px;
  border-top: 1px solid ${Colors.outline};
  background: ${Colors.white};
`;

export const PatientInfoPane = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), [setModalOpen]);
  const closeModal = useCallback(() => setModalOpen(false), [setModalOpen]);
  const { getSetting } = useSettings();
  const { patient } = usePatient();
  const api = useApi();
  const { ability } = useAuth();
  const patientDeathsEnabled = getSetting('features.enablePatientDeaths');
  const canRecordPatientDeath =
    ability?.can('create', 'PatientDeath') && ability?.can('write', 'Patient');
  const canReadPatientDeath = ability?.can('read', 'PatientDeath');
  const { data: deathData, isFetching } = useQuery(
    ['patientDeathSummary', patient?.id],
    () =>
      api.get(
        route('patient/:patientId/death', { patientId: patient?.id }),
        {},
        { showUnknownErrorToast: false },
      ),
    { enabled: patientDeathsEnabled && Boolean(patient?.dateOfDeath) },
  );

  const readonly = Boolean(patient?.dateOfDeath);
  const isPatientDeceased = readonly;
  // Reverting a death record requires read as well as create: the revert link is only
  // valid for a non-final record, and isFinal can only be determined with read access.
  // Recording a new death only requires create.
  const canActOnDeath = isPatientDeceased
    ? canRecordPatientDeath && canReadPatientDeath
    : canRecordPatientDeath;
  const showRecordDeathActions =
    !isFetching && patientDeathsEnabled && !deathData?.isFinal && canActOnDeath;
  const showCauseOfDeathButton = showRecordDeathActions && Boolean(deathData);

  // Wait for the mark-for-sync pull to finish before mounting the AI summary, so it
  // generates from a complete record rather than a partially-pulled one.
  const isPatientSyncing = useSyncState().isPatientSyncing(patient?.id);
  const patientSummaryEnabled =
    getSetting('experimentalAi.enabled') && getSetting('experimentalAi.patientSummary.enabled');
  const canReadPatientSummary = ability?.can('read', 'PatientSummary');
  const canWritePatientSummary = ability?.can('write', 'PatientSummary');
  const showAiPatientSummary =
    patientSummaryEnabled &&
    canReadPatientSummary &&
    canWritePatientSummary &&
    patient?.markedForSync &&
    !isPatientSyncing;

  if (!patient) return null;

  return (
    <Container data-testid="container-qhh8">
      <CoreInfoDisplay patient={patient} data-testid="coreinfodisplay-fxik" />
      <ListsSection data-testid="listssection-1frw">
        <HealthIdDisplay
          displayId={patient.displayId}
          isDeceased={isPatientDeceased}
          data-testid="healthiddisplay-su8y"
        />
        {showAiPatientSummary && (
          <AiPatientSummary patient={patient} data-testid="ai-patient-summary" />
        )}
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
      </ListsSection>
      <Footer data-testid="buttons-hh6n">
        {showCauseOfDeathButton && (
          <CauseOfDeathButton openModal={openModal} data-testid="causeofdeathbutton-ow4w" />
        )}
        <PrintSection patient={patient} readonly={readonly} data-testid="printsection-yt3i" />
        {showRecordDeathActions && (
          <RecordDeathSection
            patient={patient}
            openDeathModal={openModal}
            data-testid="recorddeathsection-jeoi"
          />
        )}
      </Footer>
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
