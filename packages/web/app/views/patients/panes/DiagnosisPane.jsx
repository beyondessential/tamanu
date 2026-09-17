import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { Colors } from '../../../constants/styles';
import { Button, TextButton } from '../../../components/Button';
import { PlusIcon } from '../../../assets/icons/PlusIcon';
import { DiagnosisModal } from '../../../components/DiagnosisModal';
import { DiagnosisTable } from '../../../components/DiagnosisTable';
import { SyndromicSurveillanceModal } from '../../../components/SyndromicSurveillanceModal';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { NoteModalActionBlocker } from '../../../components/NoteModalActionBlocker';
import { ENCOUNTER_OPTIONS_BY_VALUE } from '../../../constants';
import { useSettings } from '../../../contexts/Settings';
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
  justify-content: space-between;
  padding: 6px 0;
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
  onOpenModal,
  canCreate,
  canWrite,
  'data-testid': dataTestId,
}) => {
  if (state === SYNDROMIC_SURVEILLANCE_STATES.NOT_RECORDED) {
    return (
      <SyndromicSurveillanceTextButton
        $isPrimary
        onClick={onOpenModal}
        disabled={!canCreate}
        data-testid={dataTestId}
      >
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
      <SyndromicSurveillanceTextButton
        onClick={onOpenModal}
        data-testid="textbutton-syndromic-surveillance-viewedit"
      >
        <TranslatedText
          stringId={canWrite ? 'general.action.viewEdit' : 'general.action.view'}
          fallback={canWrite ? 'View/Edit' : 'View'}
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
  const [isSyndromicSurveillanceModalOpen, setIsSyndromicSurveillanceModalOpen] = useState(false);
  const { getSetting } = useSettings();
  const { ability } = useAuth();
  const isSyndromicSurveillanceEnabled = getSetting(
    'syndromicSurveillance.enableSyndromicSurveillance',
  );
  // "Create" applies when recording for the first time (no prior values); "write" applies when
  // editing an already-recorded entry. Either one on its own, or plain "read", is enough to view.
  const canCreateSyndromicSurveillance = ability.can('create', 'SyndromicSurveillance');
  const canWriteSyndromicSurveillance = ability.can('write', 'SyndromicSurveillance');
  const canViewSyndromicSurveillance =
    canCreateSyndromicSurveillance ||
    canWriteSyndromicSurveillance ||
    ability.can('read', 'SyndromicSurveillance');
  const showSyndromicSurveillance = isSyndromicSurveillanceEnabled && canViewSyndromicSurveillance;
  // TODO: derive this from real syndromic surveillance data once available, rather than assuming
  // nothing has been recorded yet.
  const syndromicSurveillanceState = SYNDROMIC_SURVEILLANCE_STATES.NOT_RECORDED;
  const isSyndromicSurveillanceRecorded =
    syndromicSurveillanceState !== SYNDROMIC_SURVEILLANCE_STATES.NOT_RECORDED;
  const canEditSyndromicSurveillance = isSyndromicSurveillanceRecorded
    ? canWriteSyndromicSurveillance
    : canCreateSyndromicSurveillance;

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
      {showSyndromicSurveillance && (
        <SyndromicSurveillanceModal
          open={isSyndromicSurveillanceModalOpen}
          onClose={() => setIsSyndromicSurveillanceModalOpen(false)}
          readOnly={!canEditSyndromicSurveillance}
          data-testid="syndromicsurveillancemodal-pane"
        />
      )}
      <ActionRow data-testid="actionrow-diagnosis">
        {showSyndromicSurveillance ? (
          <SyndromicSurveillanceStatus
            state={syndromicSurveillanceState}
            onOpenModal={() => setIsSyndromicSurveillanceModalOpen(true)}
            canCreate={canCreateSyndromicSurveillance}
            canWrite={canWriteSyndromicSurveillance}
            data-testid="syndromicsurveillancestatus-diagnosis"
          />
        ) : (
          <span />
        )}
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
      <DiagnosisTable
        encounterId={encounter.id}
        onItemClick={item => setEditedDiagnosis(item)}
        refreshCount={refreshCount}
        data-testid="diagnosistable-pane"
      />
    </TabPane>
  );
});
