import React, { useState } from 'react';
import styled from 'styled-components';

import { Colors } from '../../../constants/styles';
import { Button } from '../../../components/Button';
import { PlusIcon } from '../../../assets/icons/PlusIcon';
import { DiagnosisModal } from '../../../components/DiagnosisModal';
import { DiagnosisTable } from '../../../components/DiagnosisTable';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { NoteModalActionBlocker } from '../../../components/NoteModalActionBlocker';
import { SyndromicSurveillanceStatus } from '../../../components/SyndromicSurveillanceStatus';
import { ENCOUNTER_OPTIONS_BY_VALUE } from '../../../constants';
import { useAuth } from '../../../contexts/Auth';

const TabPane = styled.div`
  margin: 20px 24px 24px;
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  padding: 0px 12px;
  min-height: 460px;
`;

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 6px 0;
`;

const NotPermittedMessage = styled.div`
  border-top: 1px solid ${Colors.outline};
  padding: 120px 24px;
  font-size: 14px;
  font-weight: 500;
  white-space: pre;
  text-align: center;
  color: ${Colors.primary};
`;

const getIsTriage = encounter => ENCOUNTER_OPTIONS_BY_VALUE[encounter.encounterType].triageFlowOnly;

export const DiagnosisPane = React.memo(({ encounter, patient, disabled }) => {
  const { ability } = useAuth();
  const [editedDiagnosis, setEditedDiagnosis] = useState(null);
  // Listing diagnoses gates only the table. Recording a diagnosis and syndromic surveillance are
  // checked by permissions of their own, so the rest of the pane stays available without it.
  const canListDiagnoses = ability.can('list', 'EncounterDiagnosis');

  // Saving a diagnosis reloads the encounter, which remounts this pane, so the table refetches
  // without being told to.
  return (
    <TabPane data-testid="tabpane-diagnosis">
      <DiagnosisModal
        diagnosis={editedDiagnosis}
        isTriage={getIsTriage(encounter)}
        encounterId={encounter.id}
        excludeDiagnoses={encounter.diagnoses}
        onClose={() => setEditedDiagnosis(null)}
        data-testid="diagnosismodal-pane"
      />
      <ActionRow data-testid="actionrow-diagnosis">
        <SyndromicSurveillanceStatus
          encounterId={encounter.id}
          patient={patient}
          isEncounterEnded={Boolean(encounter.endDate)}
        />
        <NoteModalActionBlocker>
          <Button
            onClick={() => setEditedDiagnosis({})}
            color="primary"
            disabled={disabled}
            startIcon={<PlusIcon height={18} width={18} data-testid="plusicon-add-diagnosis" />}
            data-testid="button-add-diagnosis"
          >
            <TranslatedText
              stringId="diagnosis.action.add"
              fallback="Add diagnosis"
              data-testid="translatedtext-add-diagnosis"
            />
          </Button>
        </NoteModalActionBlocker>
      </ActionRow>
      {canListDiagnoses ? (
        <DiagnosisTable
          encounterId={encounter.id}
          // Read-only encounters (discharged, or the patient has died) list diagnoses without
          // offering to edit them, as they offer no way to add one.
          onItemClick={disabled ? undefined : setEditedDiagnosis}
          data-testid="diagnosistable-pane"
        />
      ) : (
        <NotPermittedMessage data-testid="notpermittedmessage-diagnoses">
          <TranslatedText
            stringId="encounter.pane.notPermittedText"
            fallback="You do not have permission to use this feature\nPlease speak to your System Administrator if you think this is incorrect."
            data-testid="translatedtext-diagnoses-not-permitted"
          />
        </NotPermittedMessage>
      )}
    </TabPane>
  );
});
