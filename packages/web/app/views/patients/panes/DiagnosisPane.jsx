import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { Colors } from '../../../constants/styles';
import { Button, TextButton } from '../../../components/Button';
import { DiagnosisModal } from '../../../components/DiagnosisModal';
import { DiagnosisTable } from '../../../components/DiagnosisTable';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { NoteModalActionBlocker } from '../../../components/NoteModalActionBlocker';
import { ENCOUNTER_OPTIONS_BY_VALUE } from '../../../constants';

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
  justify-content: space-between;
  padding: 14px 0;
`;

const SyndromicSurveillanceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SyndromicSurveillanceTextButton = styled(TextButton)`
  font-size: 14px;

  &,
  :hover {
    color: ${props => (props.$isPrimary ? Colors.primary : Colors.darkestText)};
    font-weight: ${props => (props.$isPrimary ? 500 : 400)};
    text-decoration: ${props => (props.$isPrimary ? 'none' : 'underline')};
  }
`;

const BoldText = styled.span`
  font-weight: 500;
`;

const SYNDROMIC_SURVEILLANCE_STATES = {
  NOT_RECORDED: 'notRecorded',
  SYMPTOMS_RECORDED: 'symptomsRecorded',
  NO_SYNDROME: 'noSyndrome',
};

// TODO: replace with real syndromic surveillance data once available
const HARDCODED_SYMPTOM_COUNT = 3;

const SyndromicSurveillanceStatus = ({
  state = SYNDROMIC_SURVEILLANCE_STATES.NOT_RECORDED,
  'data-testid': dataTestId,
}) => {
  if (state === SYNDROMIC_SURVEILLANCE_STATES.NOT_RECORDED) {
    return (
      <SyndromicSurveillanceTextButton $isPrimary data-testid={dataTestId}>
        <TranslatedText
          stringId="encounter.syndromicSurveillance.label"
          fallback="Syndromic surveillance"
          data-testid="translatedtext-syndromic-surveillance"
        />
      </SyndromicSurveillanceTextButton>
    );
  }

  return (
    <SyndromicSurveillanceRow data-testid={dataTestId}>
      <span>
        <TranslatedText
          stringId="encounter.syndromicSurveillance.label"
          fallback="Syndromic surveillance"
          data-testid="translatedtext-syndromic-surveillance"
        />
        {': '}
        <BoldText data-testid="boldtext-syndromic-surveillance-status">
          {state === SYNDROMIC_SURVEILLANCE_STATES.SYMPTOMS_RECORDED ? (
            <TranslatedText
              stringId="encounter.syndromicSurveillance.symptomsRecorded"
              fallback=":count symptoms recorded"
              replacements={{ count: HARDCODED_SYMPTOM_COUNT.toLocaleString() }}
              data-testid="translatedtext-symptoms-recorded"
            />
          ) : (
            <TranslatedText
              stringId="encounter.syndromicSurveillance.noSyndrome"
              fallback="No syndrome"
              data-testid="translatedtext-no-syndrome"
            />
          )}
        </BoldText>
      </span>
      <SyndromicSurveillanceTextButton data-testid="textbutton-syndromic-surveillance-viewedit">
        <TranslatedText
          stringId="general.action.viewEdit"
          fallback="View/Edit"
          data-testid="translatedtext-view-edit"
        />
      </SyndromicSurveillanceTextButton>
    </SyndromicSurveillanceRow>
  );
};

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
        <SyndromicSurveillanceStatus
          state={SYNDROMIC_SURVEILLANCE_STATES.NOT_RECORDED}
          data-testid="syndromicsurveillancestatus-diagnosis"
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
