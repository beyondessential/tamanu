import React, { useState } from 'react';
import styled from 'styled-components';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { DischargeModal } from '../../../components/DischargeModal';
import { ChangeEncounterTypeModal } from '../../../components/ChangeEncounterTypeModal';
import { FinalisePatientMoveModal } from './FinalisePatientMoveModal';
import { CancelPatientMoveModal } from './CancelPatientMoveModal';
import { MoveModal } from './MoveModal';
import { usePatientNavigation } from '../../../utils/usePatientNavigation';
import { Button, NoteModalActionBlocker } from '../../../components';
import { EncounterRecordModal } from '../../../components/PatientPrinting/modals/EncounterRecordModal';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { ChangeReasonModal } from '../../../components/ChangeReasonModal';
import { ChangeDietModal } from '../../../components/ChangeDietModal';
import { isInpatient } from '../../../utils/isInpatient';
import { useSettings } from '../../../contexts/Settings';
import { ThreeDotMenu } from '../../../components/ThreeDotMenu';

const ENCOUNTER_MODALS = {
  NONE: 'none',

  CHANGE_TYPE: 'changeType',
  CHANGE_REASON: 'changeReason',
  CHANGE_DIET: 'changeDiet',

  DISCHARGE: 'discharge',

  FINALISE_MOVE: 'finaliseMove',
  CANCEL_MOVE: 'cancelMove',

  ENCOUNTER_RECORD: 'encounterRecord',
  ENCOUNTER_PROGRESS_RECORD: 'encounterProgressRecord',

  MOVE: 'move',
};

const StyledButton = styled(Button)`
  white-space: nowrap;
  max-height: 40px;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const StyledThreeDotMenu = styled(ThreeDotMenu)`
  margin-left: -7px;
`;

export const EncounterActions = React.memo(({ encounter }) => {
  const { getSetting } = useSettings();
  const { navigateToSummary } = usePatientNavigation();

  const [openModal, setOpenModal] = useState(ENCOUNTER_MODALS.NONE);
  const [newEncounterType, setNewEncounterType] = useState();
  const onClose = () => setOpenModal(ENCOUNTER_MODALS.NONE);

  const progression = {
    [ENCOUNTER_TYPES.TRIAGE]: 0,
    [ENCOUNTER_TYPES.OBSERVATION]: 1,
    [ENCOUNTER_TYPES.EMERGENCY]: 2,
    [ENCOUNTER_TYPES.ADMISSION]: 3,
  };
  const isProgressionForward = (currentState, nextState) =>
    progression[nextState] > progression[currentState];

  const enablePatientMoveActions = getSetting('features.patientPlannedMove');

  const onChangeEncounterType = type => {
    setNewEncounterType(type);
    setOpenModal(ENCOUNTER_MODALS.CHANGE_TYPE);
  };

  const actions = [
    {
      label: (
        <TranslatedText
          stringId="encounter.action.moveToActiveEDCare"
          fallback="Move to active ED care"
        />
      ),
      onClick: () => onChangeEncounterType(ENCOUNTER_TYPES.OBSERVATION),
      condition: () => isProgressionForward(encounter.encounterType, ENCOUNTER_TYPES.OBSERVATION),
    },
    {
      label: (
        <TranslatedText
          stringId="encounter.action.moveToEmergencyShortStay"
          fallback="Move to emergency short stay"
        />
      ),
      onClick: () => onChangeEncounterType(ENCOUNTER_TYPES.EMERGENCY),
      condition: () => isProgressionForward(encounter.encounterType, ENCOUNTER_TYPES.EMERGENCY),
    },
    {
      label: (
        <TranslatedText stringId="encounter.action.admitToHospital" fallback="Admit to hospital" />
      ),
      onClick: () => onChangeEncounterType(ENCOUNTER_TYPES.ADMISSION),
      condition: () => isProgressionForward(encounter.encounterType, ENCOUNTER_TYPES.ADMISSION),
    },
    {
      label: (
        <TranslatedText
          stringId="encounter.action.prepareDischargeWithoutBeingSeen"
          fallback="Prepare discharge without being seen"
        />
      ),
      onClick: () => setOpenModal(ENCOUNTER_MODALS.DISCHARGE),
      condition: () => encounter.encounterType === ENCOUNTER_TYPES.TRIAGE,
    },
    {
      label: (
        <TranslatedText
          stringId="encounter.action.finalisePatientMove"
          fallback="Finalise patient move"
        />
      ),
      onClick: () => setOpenModal(ENCOUNTER_MODALS.FINALISE_MOVE),
      condition: () => enablePatientMoveActions && encounter.plannedLocation,
    },
    {
      label: (
        <TranslatedText
          stringId="encounter.action.cancelPatientMove"
          fallback="Cancel patient move"
        />
      ),
      onClick: () => setOpenModal(ENCOUNTER_MODALS.CANCEL_MOVE),
      condition: () => enablePatientMoveActions && encounter.plannedLocation,
    },
    // {
    //   label: 'Prepare discharge',
    //   onClick: () => setOpenModal(ENCOUNTER_MODALS.DISCHARGE),
    //   condition: () => encounter.encounterType !== ENCOUNTER_TYPES.TRIAGE,
    // },
    {
      label: (
        <TranslatedText stringId="encounter.action.admitToHospital" fallback="Admit to hospital" />
      ),
      onClick: () => setOpenModal(ENCOUNTER_MODALS.CHANGE_TYPE),
      condition: () => encounter.encounterType === ENCOUNTER_TYPES.CLINIC,
    },
    {
      label: <TranslatedText stringId="encounter.action.movePatient" fallback="Move patient" />,
      onClick: () => setOpenModal(ENCOUNTER_MODALS.CHANGE_LOCATION),
      condition: () => enablePatientMoveActions && !encounter.plannedLocation,
    },
    {
      label: <TranslatedText stringId="encounter.action.changeReason" fallback="Change reason" />,
      onClick: () => setOpenModal(ENCOUNTER_MODALS.CHANGE_REASON),
      condition: () =>
        [ENCOUNTER_TYPES.CLINIC, ENCOUNTER_TYPES.ADMISSION].includes(encounter.encounterType),
    },
    {
      label: <TranslatedText stringId="encounter.action.changeDiet" fallback="Change diet" />,
      onClick: () => setOpenModal(ENCOUNTER_MODALS.CHANGE_DIET),
      condition: () => isInpatient(encounter.encounterType),
    },
    {
      label: (
        <TranslatedText
          stringId="encounter.action.encounterProgressRecord"
          fallback="Encounter progress record"
        />
      ),
      onClick: () => setOpenModal(ENCOUNTER_MODALS.ENCOUNTER_PROGRESS_RECORD),
    },
    {
      label: (
        <TranslatedText stringId="encounter.action.dischargeSummary" fallback="Discharge summary" />
      ),
      onClick: () => navigateToSummary(),
      condition: () => encounter.endDate,
    },
  ].filter(action => !action.condition || action.condition());

  return (
    <NoteModalActionBlocker>
      <ActionsContainer>
        <StyledButton
          size="small"
          variant="outlined"
          onClick={() => setOpenModal(ENCOUNTER_MODALS.DISCHARGE)}
        >
          <TranslatedText
            stringId="encounter.action.prepareDischarge"
            fallback="Prepare discharge"
          />
        </StyledButton>
        <StyledButton
          size="small"
          color="primary"
          onClick={() => setOpenModal(ENCOUNTER_MODALS.MOVE)}
        >
          <TranslatedText stringId="encounter.action.movePatient" fallback="Move patient" />
        </StyledButton>
        <StyledThreeDotMenu items={actions} data-testid="threedotmenu-5t9u" />
      </ActionsContainer>

      <MoveModal
        encounter={encounter}
        open={openModal === ENCOUNTER_MODALS.MOVE}
        onClose={onClose}
        data-testid="MoveModal-00xl"
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

      {/* Patient move modals These will probably move to that new component */}

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
    </NoteModalActionBlocker>
  );
});
