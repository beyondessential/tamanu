import React, { useState } from 'react';
import { BodyText, Button, TranslatedText } from '../../../components';
import { getFullLocationName } from '../../../utils/location';
import styled from 'styled-components';
import { TAMANU_COLORS, TextButton } from '@tamanu/ui-components';
import { FinalisePatientMoveModal } from './FinalisePatientMoveModal';
import { CancelPatientMoveModal } from './CancelPatientMoveModal';
import { useAuth } from '../../../contexts/Auth';

import { BedIcon } from '../../../assets/icons/BedIcon';

const Container = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
  justify-content: flex-start;
  padding: 10px 25px;
  background-color: ${TAMANU_COLORS.white};
  border-bottom: 1px solid ${TAMANU_COLORS.outline};
`;

const FinaliseButton = styled(Button)`
  padding: 8px 12px;
  margin-left: 5px;
  min-width: 66px;
  font-size: 12px;
`;

const CancelButton = styled(TextButton)`
  color: ${TAMANU_COLORS.darkestText};
  text-decoration: underline;
  font-size: 12px;
`;

export const PlannedMoveActions = ({ encounter }) => {
  const { ability } = useAuth();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [finaliseModalOpen, setFinaliseModalOpen] = useState(false);

  const canWriteEncounter = ability.can('write', 'Encounter');
  if (!canWriteEncounter) {
    return null;
  }

  return (
    <>
      <Container>
        <BedIcon color={TAMANU_COLORS.softText} />
        <BodyText>
          <TranslatedText
            stringId="encounter.action.plannedLocationMove"
            fallback="Planned location move: "
          />
          <b>{getFullLocationName(encounter.plannedLocation)}</b>
        </BodyText>
        <FinaliseButton variant="outlined" onClick={() => setFinaliseModalOpen(true)}>
          <TranslatedText stringId="encounter.action.finalisePatientMove" fallback="Finalise" />
        </FinaliseButton>
        <CancelButton variant="text" onClick={() => setCancelModalOpen(true)}>
          <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
        </CancelButton>
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
