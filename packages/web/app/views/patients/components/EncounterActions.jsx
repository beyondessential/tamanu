import React, { useState } from 'react';
import styled from 'styled-components';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { DischargeModal } from '../../../components/DischargeModal';
import { ChangeEncounterTypeModal } from '../../../components/ChangeEncounterTypeModal';
import { ChangeDepartmentModal } from '../../../components/ChangeDepartmentModal';
import { ChangeClinicianModal } from '../../../components/ChangeClinicianModal';
import { BeginPatientMoveModal } from './BeginPatientMoveModal';
import { FinalisePatientMoveModal } from './FinalisePatientMoveModal';
import { CancelPatientMoveModal } from './CancelPatientMoveModal';
import { usePatientNavigation } from '../../../utils/usePatientNavigation';
import { Button } from '../../../components';
import { DropdownButton } from '../../../components/DropdownButton';
import { MoveModal } from './MoveModal';
import { EncounterRecordModal } from '../../../components/PatientPrinting/modals/EncounterRecordModal';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { ChangeReasonModal } from '../../../components/ChangeReasonModal';
import { ChangeDietModal } from '../../../components/ChangeDietModal';
import { isInpatient } from '../../../utils/isInpatient';
import { useSettings } from '../../../contexts/Settings';

const ActionsContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const ENCOUNTER_MODALS = {
  NONE: 'none',

  CHANGE_CLINICIAN: 'changeClinician',
  CHANGE_DEPARTMENT: 'changeDepartment',
  CHANGE_LOCATION: 'changeLocation',
  CHANGE_TYPE: 'changeType',
  CHANGE_REASON: 'changeReason',
  CHANGE_DIET: 'changeDiet',

  DISCHARGE: 'discharge',

  BEGIN_MOVE: 'beginMove',
  FINALISE_MOVE: 'finaliseMove',
  CANCEL_MOVE: 'cancelMove',

  ENCOUNTER_RECORD: 'encounterRecord',
  ENCOUNTER_PROGRESS_RECORD: 'encounterProgressRecord',
};

const StyledButton = styled(Button)`
  white-space: nowrap;
  max-height: 40px;
`;

const StyledDropdownButton = styled(DropdownButton)`
  white-space: nowrap;
  max-height: 40px;
`;

const EncounterActionDropdown = ({ encounter, setOpenModal, setNewEncounterType }) => {
  const { navigateToSummary } = usePatientNavigation();
  const { getSetting } = useSettings();

  const onChangeEncounterType = type => {
    setNewEncounterType(type);
    setOpenModal(ENCOUNTER_MODALS.CHANGE_TYPE);
  };
  const onDischargeOpen = () => setOpenModal(ENCOUNTER_MODALS.DISCHARGE);
  const onChangeDepartment = () => setOpenModal(ENCOUNTER_MODALS.CHANGE_DEPARTMENT);
  const onChangeClinician = () => setOpenModal(ENCOUNTER_MODALS.CHANGE_CLINICIAN);
  const onPlanLocationChange = () => setOpenModal(ENCOUNTER_MODALS.BEGIN_MOVE);
  const onFinaliseLocationChange = () => setOpenModal(ENCOUNTER_MODALS.FINALISE_MOVE);
  const onCancelLocationChange = () => setOpenModal(ENCOUNTER_MODALS.CANCEL_MOVE);
  const onChangeLocation = () => setOpenModal(ENCOUNTER_MODALS.CHANGE_LOCATION);
  const onViewSummary = () => navigateToSummary();
  const onViewEncounterRecord = () => setOpenModal(ENCOUNTER_MODALS.ENCOUNTER_RECORD);
  const onViewEncounterProgressRecord = () =>
    setOpenModal(ENCOUNTER_MODALS.ENCOUNTER_PROGRESS_RECORD);
  const onChangeReason = () => setOpenModal(ENCOUNTER_MODALS.CHANGE_REASON);
  const onChangeDiet = () => setOpenModal(ENCOUNTER_MODALS.CHANGE_DIET);

  if (encounter.endDate) {
    return (
      <ActionsContainer>
        <StyledButton size="small" variant="outlined" onClick={onViewEncounterRecord}>
          <TranslatedText
            stringId="patient.encounter.action.encounterSummary"
            fallback="Encounter summary"
          />
        </StyledButton>
        <br />
        <StyledButton size="small" color="primary" onClick={onViewSummary}>
          <TranslatedText
            stringId="patient.encounter.action.dischargeSummary"
            fallback="Discharge summary"
          />
        </StyledButton>
      </ActionsContainer>
    );
  }

  const progression = {
    [ENCOUNTER_TYPES.TRIAGE]: 0,
    [ENCOUNTER_TYPES.OBSERVATION]: 1,
    [ENCOUNTER_TYPES.EMERGENCY]: 2,
    [ENCOUNTER_TYPES.ADMISSION]: 3,
  };
  const isProgressionForward = (currentState, nextState) =>
    progression[nextState] > progression[currentState];

  const enablePatientMoveActions = getSetting('features.patientPlannedMove');

  const actions = [
    {
      label: (
        <TranslatedText
          stringId="patient.encounter.action.moveToEdCare"
          fallback="Move to active ED care"
        />
      ),
      onClick: () => onChangeEncounterType(ENCOUNTER_TYPES.OBSERVATION),
      condition: () => isProgressionForward(encounter.encounterType, ENCOUNTER_TYPES.OBSERVATION),
    },
    {
      label: (
        <TranslatedText
          stringId="patient.encounter.action.moveToShortStay"
          fallback="Move to emergency short stay"
        />
      ),
      onClick: () => onChangeEncounterType(ENCOUNTER_TYPES.EMERGENCY),
      condition: () => isProgressionForward(encounter.encounterType, ENCOUNTER_TYPES.EMERGENCY),
    },
    {
      label: (
        <TranslatedText
          stringId="patient.encounter.action.admitToHospital"
          fallback="Admit to hospital"
        />
      ),
      onClick: () => onChangeEncounterType(ENCOUNTER_TYPES.ADMISSION),
      condition: () => isProgressionForward(encounter.encounterType, ENCOUNTER_TYPES.ADMISSION),
    },
    {
      label: (
        <TranslatedText
          stringId="patient.encounter.action.prepareDischargeWithoutBeingSeen"
          fallback="Prepare discharge without being seen"
        />
      ),
      onClick: onDischargeOpen,
      condition: () => encounter.encounterType === ENCOUNTER_TYPES.TRIAGE,
    },
    {
      label: (
        <TranslatedText
          stringId="patient.encounter.action.finalisePatientMove"
          fallback="Finalise patient move"
        />
      ),
      condition: () => enablePatientMoveActions && encounter.plannedLocation,
      onClick: onFinaliseLocationChange,
    },
    {
      label: (
        <TranslatedText
          stringId="patient.encounter.action.cancelPatientMove"
          fallback="Cancel patient move"
        />
      ),
      condition: () => enablePatientMoveActions && encounter.plannedLocation,
      onClick: onCancelLocationChange,
    },
    {
      label: <TranslatedText stringId="patient.encounter.action.prepareDischarge" fallback="Prepare discharge" />,
      onClick: onDischargeOpen,
      condition: () => encounter.encounterType !== ENCOUNTER_TYPES.TRIAGE,
    },
    {
      // Duplicate "Admit to hospital" as it should display below "Discharge".
      label: (
        <TranslatedText
          stringId="patient.encounter.action.admitToHospital"
          fallback="Admit to hospital"
        />
      ),
      onClick: () => onChangeEncounterType(ENCOUNTER_TYPES.ADMISSION),
      condition: () => encounter.encounterType === ENCOUNTER_TYPES.CLINIC,
    },
    {
      label: (
        <TranslatedText stringId="patient.encounter.action.movePatient" fallback="Move patient" />
      ),
      condition: () => enablePatientMoveActions && !encounter.plannedLocation,
      onClick: onPlanLocationChange,
    },
    {
      label: (
        <TranslatedText
          stringId="patient.encounter.action.changeDepartment"
          fallback="Change department"
        />
      ),
      onClick: onChangeDepartment,
    },
    {
      label: (
        <TranslatedText
          stringId="encounter.action.changeClinician"
          fallback="Change :clinician"
          replacements={{
            clinician: (
              <TranslatedText
                stringId="general.localisedField.clinician.label"
                fallback="Clinician"
                casing="lower"
              />
            ),
          }}
        />
      ),
      onClick: onChangeClinician,
    },
    {
      label: (
        <TranslatedText
          stringId="patient.encounter.action.changeLocation"
          fallback="Change location"
        />
      ),
      condition: () => !enablePatientMoveActions && !encounter.plannedLocation,
      onClick: onChangeLocation,
    },
    {
      label: (
        <TranslatedText stringId="patient.encounter.action.changeReason" fallback="Change reason" />
      ),
      condition: () =>
        [ENCOUNTER_TYPES.CLINIC, ENCOUNTER_TYPES.ADMISSION].includes(encounter.encounterType),
      onClick: onChangeReason,
    },
    {
      label: (
        <TranslatedText stringId="patient.encounter.action.changeDiet" fallback="Change diet" />
      ),
      condition: () => isInpatient(encounter.encounterType),
      onClick: onChangeDiet,
    },
    {
      label: (
        <TranslatedText
          stringId="patient.encounter.action.encounterProgressRecord"
          fallback="Encounter progress record"
        />
      ),
      onClick: onViewEncounterProgressRecord,
    },
  ].filter(action => !action.condition || action.condition());

  return <StyledDropdownButton actions={actions} />;
};

export const EncounterActions = React.memo(({ encounter }) => {
  const [openModal, setOpenModal] = useState(ENCOUNTER_MODALS.NONE);
  const [newEncounterType, setNewEncounterType] = useState();
  const onClose = () => setOpenModal(ENCOUNTER_MODALS.NONE);

  return (
    <>
      <EncounterActionDropdown
        encounter={encounter}
        setOpenModal={setOpenModal}
        setNewEncounterType={setNewEncounterType}
      />
      <DischargeModal
        encounter={encounter}
        open={openModal === ENCOUNTER_MODALS.DISCHARGE}
        onClose={onClose}
      />
      <ChangeEncounterTypeModal
        encounter={encounter}
        open={openModal === ENCOUNTER_MODALS.CHANGE_TYPE}
        onClose={onClose}
        newType={newEncounterType}
      />
      <ChangeDepartmentModal
        open={openModal === ENCOUNTER_MODALS.CHANGE_DEPARTMENT}
        onClose={onClose}
      />
      <ChangeClinicianModal
        open={openModal === ENCOUNTER_MODALS.CHANGE_CLINICIAN}
        onClose={onClose}
      />
      <MoveModal
        encounter={encounter}
        open={openModal === ENCOUNTER_MODALS.CHANGE_LOCATION}
        onClose={onClose}
      />
      <BeginPatientMoveModal
        encounter={encounter}
        open={openModal === ENCOUNTER_MODALS.BEGIN_MOVE}
        onClose={onClose}
      />
      <FinalisePatientMoveModal
        encounter={encounter}
        open={openModal === ENCOUNTER_MODALS.FINALISE_MOVE}
        onClose={onClose}
      />
      <CancelPatientMoveModal
        encounter={encounter}
        open={openModal === ENCOUNTER_MODALS.CANCEL_MOVE}
        onClose={onClose}
      />
      <EncounterRecordModal
        encounter={encounter}
        open={openModal === ENCOUNTER_MODALS.ENCOUNTER_RECORD || openModal === ENCOUNTER_MODALS.ENCOUNTER_PROGRESS_RECORD}
        onClose={onClose}
      />
      <ChangeReasonModal
        encounter={encounter}
        open={openModal === ENCOUNTER_MODALS.CHANGE_REASON}
        onClose={onClose}
      />
      <ChangeDietModal
        encounter={encounter}
        open={openModal === ENCOUNTER_MODALS.CHANGE_DIET}
        onClose={onClose}
      />
    </>
  );
});
