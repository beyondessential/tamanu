import React, { useState } from 'react';
import { BodyText, Button, TranslatedText } from '../../../components';
import { getFullLocationName } from '../../../utils/location';
import styled from 'styled-components';
import { TAMANU_COLORS, TextButton } from '@tamanu/ui-components';
import { FinalisePatientMoveModal } from './FinalisePatientMoveModal';
import { CancelPatientMoveModal } from './CancelPatientMoveModal';

import { BedIcon } from '../../../assets/icons/BedIcon';

const Container = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  height: 40px;
  align-items: center;
  justify-content: flex-start;
  padding: 30px 25px;
  background-color: ${TAMANU_COLORS.white};
  border-bottom: 1px solid ${TAMANU_COLORS.outline};
`;

const FinaliseButton = styled(Button)`
  margin-left: 10px;
`;

const CancelButton = styled(TextButton)`
  font-size: 14px;
`;

export const PlannedMoveActions = ({ encounter }) => {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [finaliseModalOpen, setFinaliseModalOpen] = useState(false);

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
