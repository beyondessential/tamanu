import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, TranslatedText } from '@tamanu/ui-components';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { DischargeModal } from '../../../components/DischargeModal';
import { ChangeEncounterTypeModal } from '../../../components/ChangeEncounterTypeModal';
import { ChangeDepartmentModal } from '../../../components/ChangeDepartmentModal';
import { ChangeClinicianModal } from '../../../components/ChangeClinicianModal';
import { BeginPatientMoveModal } from './BeginPatientMoveModal';
import { FinalisePatientMoveModal } from './FinalisePatientMoveModal';
import { CancelPatientMoveModal } from './CancelPatientMoveModal';
import { usePatientNavigation } from '../../../utils/usePatientNavigation';
import { NoteModalActionBlocker } from '../../../components';
import { DropdownButton } from '../../../components/DropdownButton';
import { MoveModal } from './MoveModal';
import { EncounterRecordModal } from '../../../components/PatientPrinting/modals/EncounterRecordModal';
import { ChangeReasonModal } from '../../../components/ChangeReasonModal';
import { ChangeDietModal } from '../../../components/ChangeDietModal';
import { isInpatient } from '../../../utils/isInpatient';
import { useSettings } from '../../../contexts/Settings';
import { useEncounterDischargeQuery } from '../../../api/queries/useEncounterDischargeQuery';

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
  const { data: discharge } = useEncounterDischargeQuery(encounter);

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
      discharge ? (
        <ActionsContainer data-testid="actionscontainer-w92z">
          <StyledButton
            size="small"
            variant="outlined"
            onClick={onViewEncounterRecord}
            data-testid="styledbutton-00iz"
          >
            <TranslatedText
              stringId="patient.encounter.action.encounterSummary"
              fallback="Encounter summary"
              data-testid="translatedtext-ftbh"
            />
          </StyledButton>
          <br />
          <StyledButton
            size="small"
            color="primary"
            onClick={onViewSummary}
            data-testid="styledbutton-0m1p"
          >
            <TranslatedText
              stringId="patient.encounter.action.dischargeSummary"
              fallback="Discharge summary"
              data-testid="translatedtext-0hzq"
            />
          </StyledButton>
        </ActionsContainer>
      ) : <></>)
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
          data-testid="translatedtext-ebwz"
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
          data-testid="translatedtext-3mla"
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
          data-testid="translatedtext-lav0"
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
          data-testid="translatedtext-f8lm"
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
          data-testid="translatedtext-10xc"
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
          data-testid="translatedtext-0d5b"
        />
      ),
      condition: () => enablePatientMoveActions && encounter.plannedLocation,
      onClick: onCancelLocationChange,
    },
    {
      label: (
        <TranslatedText
          stringId="patient.encounter.action.prepareDischarge"
          fallback="Prepare discharge"
          data-testid="translatedtext-zxed"
        />
      ),
      onClick: onDischargeOpen,
      condition: () => encounter.encounterType !== ENCOUNTER_TYPES.TRIAGE,
    },
    {
      // Duplicate "Admit to hospital" as it should display below "Discharge".
      label: (
        <TranslatedText
          stringId="patient.encounter.action.admitToHospital"
          fallback="Admit to hospital"
          data-testid="translatedtext-4l99"
        />
      ),
      onClick: () => onChangeEncounterType(ENCOUNTER_TYPES.ADMISSION),
      condition: () => encounter.encounterType === ENCOUNTER_TYPES.CLINIC,
    },
    {
      label: (
        <TranslatedText
          stringId="patient.encounter.action.movePatient"
          fallback="Move patient"
          data-testid="translatedtext-7n9k"
        />
      ),
      condition: () => enablePatientMoveActions && !encounter.plannedLocation,
      onClick: onPlanLocationChange,
    },
    {
      label: (
        <TranslatedText
          stringId="patient.encounter.action.changeDepartment"
          fallback="Change department"
          data-testid="translatedtext-0dtg"
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
                data-testid="translatedtext-5pzw"
              />
            ),
          }}
          data-testid="translatedtext-5dr2"
        />
      ),
      onClick: onChangeClinician,
    },
    {
      label: (
        <TranslatedText
          stringId="patient.encounter.action.changeLocation"
          fallback="Change location"
          data-testid="translatedtext-a1zx"
        />
      ),
      condition: () => !enablePatientMoveActions && !encounter.plannedLocation,
      onClick: onChangeLocation,
    },
    {
      label: (
        <TranslatedText
          stringId="patient.encounter.action.changeReason"
          fallback="Change reason"
          data-testid="translatedtext-kjya"
        />
      ),
      condition: () =>
        [ENCOUNTER_TYPES.CLINIC, ENCOUNTER_TYPES.ADMISSION].includes(encounter.encounterType),
      onClick: onChangeReason,
    },
    {
      label: (
        <TranslatedText
          stringId="patient.encounter.action.changeDiet"
          fallback="Change diet"
          data-testid="translatedtext-p8fm"
        />
      ),
      condition: () => isInpatient(encounter.encounterType),
      onClick: onChangeDiet,
    },
    {
      label: (
        <TranslatedText
          stringId="patient.encounter.action.encounterProgressRecord"
          fallback="Encounter progress record"
          data-testid="translatedtext-fhfi"
        />
      ),
      onClick: onViewEncounterProgressRecord,
    },
  ].filter(action => !action.condition || action.condition());

  return (
    <NoteModalActionBlocker>
      <StyledDropdownButton actions={actions} data-testid="styleddropdownbutton-zjxy" />
    </NoteModalActionBlocker>
  );
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
        data-testid="encounteractiondropdown-n27n"
      />
      <DischargeModal
        encounter={encounter}
        open={openModal === ENCOUNTER_MODALS.DISCHARGE}
        onClose={onClose}
        data-testid="dischargemodal-9lol"
      />
      <ChangeEncounterTypeModal
        encounter={encounter}
        open={openModal === ENCOUNTER_MODALS.CHANGE_TYPE}
        onClose={onClose}
        newType={newEncounterType}
        data-testid="changeencountertypemodal-crha"
      />
      <ChangeDepartmentModal
        open={openModal === ENCOUNTER_MODALS.CHANGE_DEPARTMENT}
        onClose={onClose}
        data-testid="changedepartmentmodal-uqvy"
      />
      <ChangeClinicianModal
        open={openModal === ENCOUNTER_MODALS.CHANGE_CLINICIAN}
        onClose={onClose}
        data-testid="changeclinicianmodal-hmn3"
      />
      <MoveModal
        encounter={encounter}
        open={openModal === ENCOUNTER_MODALS.CHANGE_LOCATION}
        onClose={onClose}
        data-testid="movemodal-me3p"
      />
      <BeginPatientMoveModal
        encounter={encounter}
        open={openModal === ENCOUNTER_MODALS.BEGIN_MOVE}
        onClose={onClose}
        data-testid="beginpatientmovemodal-2upr"
      />
      <FinalisePatientMoveModal
        encounter={encounter}
        open={openModal === ENCOUNTER_MODALS.FINALISE_MOVE}
        onClose={onClose}
        data-testid="finalisepatientmovemodal-hvk3"
      />
      <CancelPatientMoveModal
        encounter={encounter}
        open={openModal === ENCOUNTER_MODALS.CANCEL_MOVE}
        onClose={onClose}
        data-testid="cancelpatientmovemodal-x8xx"
      />
      <EncounterRecordModal
        encounter={encounter}
        open={
          openModal === ENCOUNTER_MODALS.ENCOUNTER_RECORD ||
          openModal === ENCOUNTER_MODALS.ENCOUNTER_PROGRESS_RECORD
        }
        onClose={onClose}
        data-testid="encounterrecordmodal-00xl"
      />
      <ChangeReasonModal
        encounter={encounter}
        open={openModal === ENCOUNTER_MODALS.CHANGE_REASON}
        onClose={onClose}
        data-testid="changereasonmodal-a2yv"
      />
      <ChangeDietModal
        encounter={encounter}
        open={openModal === ENCOUNTER_MODALS.CHANGE_DIET}
        onClose={onClose}
        data-testid="changedietmodal-imzd"
      />
    </>
  );
});
