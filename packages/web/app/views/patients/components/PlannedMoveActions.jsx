import React, { useState } from 'react';
import { BodyText, Button, TranslatedText } from '../../../components';
import { getFullLocationName } from '../../../utils/location';
import styled from 'styled-components';
import { TAMANU_COLORS } from '@tamanu/ui-components';
import { FinalisePatientMoveModal } from './FinalisePatientMoveModal';
import { CancelPatientMoveModal } from './CancelPatientMoveModal';

const Container = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  height: 40px;
  align-items: center;
  justify-content: flex-start;
  padding: 30px;
  background-color: ${TAMANU_COLORS.white};
  border-bottom: 1px solid ${TAMANU_COLORS.outline};
`;

const ENCOUNTER_MODALS = {
  NONE: 'none',

  FINALISE_MOVE: 'finaliseMove',
  CANCEL_MOVE: 'cancelMove',
};

export const PlannedMoveActions = ({ encounter }) => {
  const [openModal, setOpenModal] = useState(ENCOUNTER_MODALS.NONE);
  const onClose = () => setOpenModal(ENCOUNTER_MODALS.NONE);

  return (
    <>
      <Container>
        <BodyText>
          <TranslatedText
            stringId="encounter.action.plannedLocationMove"
            fallback="Planned location move: "
          />
          <b>{getFullLocationName(encounter.plannedLocation)}</b>
        </BodyText>
        <Button variant="outlined" onClick={() => setOpenModal(ENCOUNTER_MODALS.FINALISE_MOVE)}>
          <TranslatedText
            stringId="encounter.action.finalisePatientMove"
            fallback="Finalise move"
          />
        </Button>
        <Button variant="text" onClick={() => setOpenModal(ENCOUNTER_MODALS.CANCEL_MOVE)}>
          <TranslatedText stringId="encounter.action.cancelPatientMove" fallback="Cancel" />
        </Button>
      </Container>
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
    </>
  );
};
