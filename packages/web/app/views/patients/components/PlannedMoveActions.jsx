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

export const PlannedMoveActions = ({ encounter }) => {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [finaliseModalOpen, setFinaliseModalOpen] = useState(false);

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
        <Button variant="outlined" onClick={() => setFinaliseModalOpen(true)}>
          <TranslatedText
            stringId="encounter.action.finalisePatientMove"
            fallback="Finalise move"
          />
        </Button>
        <Button variant="text" onClick={() => setCancelModalOpen(true)}>
          <TranslatedText stringId="encounter.action.cancelPatientMove" fallback="Cancel" />
        </Button>
      </Container>

      <FinalisePatientMoveModal
        encounter={encounter}
        open={finaliseModalOpen}
        onClose={() => setFinaliseModalOpen(false)}
        data-testid="finalisepatientmovemodal-hvk3"
      />
      <CancelPatientMoveModal
        encounter={encounter}
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        data-testid="cancelpatientmovemodal-x8xx"
      />
    </>
  );
};
