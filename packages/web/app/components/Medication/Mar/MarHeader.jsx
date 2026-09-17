import React, { useState } from 'react';
import styled from 'styled-components';

import {
  ButtonWithPermissionCheck,
  ConditionalTooltip,
  TranslatedText,
} from '@tamanu/ui-components';
import { useAuth } from '../../../contexts/Auth';
import { useEncounter } from '../../../contexts/Encounter';
import useIsEncounterDischarged from '../../../hooks/useIsEncounterDischarged';
import { NoteModalActionBlocker } from '../../NoteModalActionBlocker';
import { Heading3 } from '../../Typography';
import { MedicationModal } from '../MedicationModal';
import { MarDateSelector } from './MarDateSelector';

const Header = styled.header`
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding-block: 2px;
  padding-inline: 12px;
`;

const ButtonWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: flex-end;
`;

export const MarHeader = ({ selectedDate, onDateChange }) => {
  const [createMedicationModalOpen, setCreateMedicationModalOpen] = useState(false);
  const { encounter } = useEncounter();
  const { ability } = useAuth();
  const canCreatePrescription = ability.can('create', 'Medication');
  const isEncounterDischarged = useIsEncounterDischarged();

  return (
    <Header>
      <MedicationModal
        open={createMedicationModalOpen}
        encounterId={encounter?.id}
        onClose={() => setCreateMedicationModalOpen(false)}
        onSaved={async () => {
          setCreateMedicationModalOpen(false);
        }}
      />
      <Heading3 flex={1}>
        <TranslatedText stringId="encounter.mar.title" fallback="Medication admin record" />
      </Heading3>
      <MarDateSelector selectedDate={selectedDate} onDateChange={onDateChange} />
      <ButtonWrapper>
        {canCreatePrescription && (
          <NoteModalActionBlocker>
            <ConditionalTooltip
              visible={isEncounterDischarged}
              title={
                <TranslatedText
                  stringId="medication.action.newPrescription.tooltip"
                  fallback="A new prescription can’t be created once an encounter has been discharged. Please add any ongoing medications via the patient-level Medications tab."
                />
              }
            >
              <ButtonWithPermissionCheck
                onClick={() => setCreateMedicationModalOpen(true)}
                verb="create"
                noun="Medication"
                disabled={isEncounterDischarged}
              >
                <TranslatedText
                  stringId="medication.action.newPrescription"
                  fallback="New prescription"
                />
              </ButtonWithPermissionCheck>
            </ConditionalTooltip>
          </NoteModalActionBlocker>
        )}
      </ButtonWrapper>
    </Header>
  );
};
