import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, TranslatedText } from '@tamanu/ui-components';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { DischargeModal } from '../../../components/DischargeModal';
import { MoveModal } from './MoveModal';
import { EditEncounterModal } from './EditEncounterModal';
import { usePatientNavigation } from '../../../utils/usePatientNavigation';
import { NoteModalActionBlocker } from '../../../components';
import { EncounterRecordModal } from '../../../components/PatientPrinting/modals/EncounterRecordModal';
import { ThreeDotMenu } from '../../../components/ThreeDotMenu';
import { useAuth } from '../../../contexts/Auth';

const ENCOUNTER_MODALS = {
  NONE: 'none',
  DISCHARGE: 'discharge',
  EDIT: 'edit',
  ENCOUNTER_PROGRESS_RECORD: 'encounterProgressRecord',
  MOVE: 'move',
};

const StyledButton = styled(Button)`
  white-space: nowrap;
  max-height: 40px;
`;

const MoveButton = styled(StyledButton)`
  margin-right: -7px;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const ENCOUNTER_TYPE_PROGRESSION = {
  [ENCOUNTER_TYPES.TRIAGE]: 0,
  [ENCOUNTER_TYPES.OBSERVATION]: 1,
  [ENCOUNTER_TYPES.EMERGENCY]: 2,
  [ENCOUNTER_TYPES.ADMISSION]: 3,
};

const isProgressionForward = (currentState, nextState) =>
  ENCOUNTER_TYPE_PROGRESSION[nextState] > ENCOUNTER_TYPE_PROGRESSION[currentState];

export const EncounterActions = React.memo(({ encounter }) => {
  const { navigateToSummary } = usePatientNavigation();
  const { ability } = useAuth();
  const [openModal, setOpenModal] = useState(ENCOUNTER_MODALS.NONE);
  const [newEncounterType, setNewEncounterType] = useState();
  const onClose = () => setOpenModal(ENCOUNTER_MODALS.NONE);
  const onViewSummary = () => navigateToSummary();

  const canWriteEncounter = ability.can('write', 'Encounter');

  if (encounter.endDate) {
    // Ideally we would have a dedicated encounter type for discharged encounters and filter
    // at the same level as the other encounter types. Because discharge uses clinic data we
    // need this extra check here to only show encounter/discharge summary actions when
    // the encounter is actually discharged (discharge record exists).
    return (
      <ActionsContainer data-testid="actionscontainer-w92z">
        <StyledButton
          size="small"
          variant="outlined"
          onClick={() => setOpenModal(ENCOUNTER_MODALS.ENCOUNTER_PROGRESS_RECORD)}
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
    );
  }

  const onChangeEncounterType = type => {
    setNewEncounterType(type);
    setOpenModal(ENCOUNTER_MODALS.MOVE);
  };

  const actions = [
    {
      label: (
        <TranslatedText
          stringId="encounter.action.editEncounterDetails"
          fallback="Edit encounter details"
        />
      ),
      onClick: () => setOpenModal(ENCOUNTER_MODALS.EDIT),
      condition: () => canWriteEncounter,
    },
    {
      label: (
        <TranslatedText
          stringId="encounter.action.transferToActiveEDCare"
          fallback="Transfer to Active ED care"
        />
      ),
      onClick: () => onChangeEncounterType(ENCOUNTER_TYPES.OBSERVATION),
      condition: () =>
        canWriteEncounter &&
        isProgressionForward(encounter.encounterType, ENCOUNTER_TYPES.OBSERVATION),
    },
    {
      label: (
        <TranslatedText
          stringId="encounter.action.transferToEmergencyShortStay"
          fallback="Transfer to Emergency short stay"
        />
      ),
      onClick: () => onChangeEncounterType(ENCOUNTER_TYPES.EMERGENCY),
      condition: () =>
        canWriteEncounter &&
        isProgressionForward(encounter.encounterType, ENCOUNTER_TYPES.EMERGENCY),
    },
    {
      label: (
        <TranslatedText stringId="encounter.action.admitToHospital" fallback="Admit to hospital" />
      ),
      onClick: () => onChangeEncounterType(ENCOUNTER_TYPES.ADMISSION),
      condition: () =>
        canWriteEncounter &&
        (isProgressionForward(encounter.encounterType, ENCOUNTER_TYPES.ADMISSION) ||
          encounter.encounterType === ENCOUNTER_TYPES.CLINIC),
    },
    {
      label: (
        <TranslatedText
          stringId="encounter.action.prepareDischargeWithoutBeingSeen"
          fallback="Prepare discharge without being seen"
        />
      ),
      onClick: () => setOpenModal(ENCOUNTER_MODALS.DISCHARGE),
      condition: () => canWriteEncounter && encounter.encounterType === ENCOUNTER_TYPES.TRIAGE,
    },
    {
      label: (
        <TranslatedText
          stringId="encounter.action.encounterProgressRecord"
          fallback="Encounter progress record"
        />
      ),
      onClick: () => setOpenModal(ENCOUNTER_MODALS.ENCOUNTER_PROGRESS_RECORD),
      condition: () => !encounter.endDate,
    },
  ].filter(action => !action.condition || action.condition());

  return (
    <NoteModalActionBlocker>
      <ActionsContainer>
        {encounter.endDate ? (
          <>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setOpenModal(ENCOUNTER_MODALS.ENCOUNTER_PROGRESS_RECORD)}
            >
              <TranslatedText
                stringId="encounter.action.encounterSummary"
                fallback="Encounter summary"
              />
            </Button>
            <Button size="small" onClick={() => navigateToSummary()}>
              <TranslatedText
                stringId="encounter.action.dischargeSummary"
                fallback="Discharge summary"
              />
            </Button>
          </>
        ) : (
          <>
            <StyledButton
              size="small"
              variant="outlined"
              onClick={() => setOpenModal(ENCOUNTER_MODALS.DISCHARGE)}
              disabled={!canWriteEncounter}
            >
              <TranslatedText
                stringId="encounter.action.prepareDischarge"
                fallback="Prepare discharge"
              />
            </StyledButton>
            <MoveButton
              size="small"
              color="primary"
              disabled={!canWriteEncounter}
              onClick={() => {
                setNewEncounterType(null);
                setOpenModal(ENCOUNTER_MODALS.MOVE);
              }}
            >
              <TranslatedText stringId="encounter.action.movePatient" fallback="Move patient" />
            </MoveButton>
          </>
        )}
        <ThreeDotMenu items={actions} data-testid="threedotmenu-5t9u" />
      </ActionsContainer>

      {/* Hidden modals */}
      <MoveModal
        encounter={encounter}
        newEncounterType={newEncounterType}
        open={openModal === ENCOUNTER_MODALS.MOVE}
        onClose={onClose}
        data-testid="MoveModal-00xl"
      />

      <EditEncounterModal
        encounter={encounter}
        open={openModal === ENCOUNTER_MODALS.EDIT}
        onClose={onClose}
      />

      <DischargeModal
        encounter={encounter}
        open={openModal === ENCOUNTER_MODALS.DISCHARGE}
        onClose={onClose}
        data-testid="dischargemodal-9lol"
      />
      <EncounterRecordModal
        encounter={encounter}
        open={openModal === ENCOUNTER_MODALS.ENCOUNTER_PROGRESS_RECORD}
        onClose={onClose}
        data-testid="encounterrecordmodal-00xl"
      />
    </NoteModalActionBlocker>
  );
});
