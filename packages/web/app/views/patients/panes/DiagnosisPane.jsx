import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { Colors } from '../../../constants/styles';
import { Button } from '../../../components/Button';
import { DiagnosisModal } from '../../../components/DiagnosisModal';
import { DiagnosisTable } from '../../../components/DiagnosisTable';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { NoteModalActionBlocker } from '../../../components/NoteModalActionBlocker';
import { ENCOUNTER_OPTIONS_BY_VALUE } from '../../../constants';

const TabPane = styled.div`
  margin: 20px 24px 24px;
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  padding: 6px 12px;
  min-height: 460px;
`;

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
`;

const getIsTriage = encounter => ENCOUNTER_OPTIONS_BY_VALUE[encounter.encounterType].triageFlowOnly;

export const DiagnosisPane = React.memo(({ encounter, disabled }) => {
  const [editedDiagnosis, setEditedDiagnosis] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const refreshDiagnosisTable = useCallback(() => {
    setRefreshCount(prev => prev + 1);
  }, []);

  return (
    <TabPane data-testid="tabpane-diagnosis">
      <DiagnosisModal
        diagnosis={editedDiagnosis}
        isTriage={getIsTriage(encounter)}
        encounterId={encounter.id}
        excludeDiagnoses={encounter.diagnoses}
        onClose={() => setEditedDiagnosis(null)}
        onSaved={refreshDiagnosisTable}
        data-testid="diagnosismodal-pane"
      />
      <ActionRow data-testid="actionrow-diagnosis">
        <TranslatedText
          stringId="diagnosis.list.heading"
          fallback="Diagnosis"
          data-testid="translatedtext-heading"
        />
        <NoteModalActionBlocker>
          <Button
            onClick={() => setEditedDiagnosis({})}
            variant="outlined"
            color="primary"
            disabled={disabled}
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
      <DiagnosisTable
        encounterId={encounter.id}
        onItemClick={item => setEditedDiagnosis(item)}
        refreshCount={refreshCount}
        data-testid="diagnosistable-pane"
      />
    </TabPane>
  );
});
