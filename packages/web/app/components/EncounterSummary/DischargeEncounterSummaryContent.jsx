import React, { useState } from 'react';
import { IconButton } from '@material-ui/core';
import CircularProgress from '@material-ui/core/CircularProgress';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { TranslatedText } from '../Translation/TranslatedText';
import { DiscardAiSummaryConfirmModal } from '../DiscardAiSummaryConfirmModal';
import { useAiEncounterSummaryQuery } from '../../api/queries/useAiEncounterSummaryQuery';
import {
  useDiscardAiEncounterSummary,
  useGenerateAiEncounterSummary,
  useSaveAiEncounterSummary,
} from '../../api/mutations/useAiEncounterSummaryMutation';
import {
  Body,
  CancelButton,
  Disclaimer,
  DiscardButton,
  EditActions,
  EditTextarea,
  EditedText,
  ErrorText,
  GenerateButton,
  LoadingContainer,
  SaveButton,
  Section,
  SectionAction,
  SectionLabel,
  SparkleIcon,
  StyledEditIcon,
  SummaryBox,
  SummaryFooter,
  SummaryText,
} from './styles';

const SectionTitle = () => (
  <SectionLabel>
    <TranslatedText
      stringId="discharge.encounterSummary.label"
      fallback="Encounter summary"
    />
  </SectionLabel>
);

export const DischargeEncounterSummaryContent = ({ encounterId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);

  const { data, isLoading: isLoadingExisting } = useAiEncounterSummaryQuery(encounterId);

  const {
    mutate: generateSummary,
    isLoading: isGenerating,
    error: generateError,
  } = useGenerateAiEncounterSummary(encounterId);

  const { mutate: saveSummary, isLoading: isSaving } = useSaveAiEncounterSummary(encounterId);
  const { mutate: discardSummary, isLoading: isDiscarding } =
    useDiscardAiEncounterSummary(encounterId);

  const aiDocument = data?.aiDocument;
  const hasActiveDocument = aiDocument && aiDocument.status !== 'discarded' && aiDocument.content;
  const documentId = aiDocument?.id;
  const summary = hasActiveDocument ? aiDocument.content : null;
  const isHumanEdited = aiDocument?.source === 'human' && aiDocument?.status === 'edited';
  const isBusy = isSaving || isDiscarding;

  const handleGenerate = () => generateSummary();

  const handleEdit = () => {
    setEditContent(summary ?? '');
    setIsEditing(true);
  };

  const handleCancel = () => setIsEditing(false);

  const handleSave = () => {
    if (!documentId) return;
    saveSummary({ id: documentId, content: editContent }, { onSuccess: () => setIsEditing(false) });
  };

  const handleConfirmDiscard = () => {
    if (!documentId) return;
    discardSummary(documentId, {
      onSuccess: () => {
        setIsDiscardConfirmOpen(false);
        setIsEditing(false);
      },
    });
  };

  const isLoading = isLoadingExisting || isGenerating;
  const showGenerate = !isLoading && !hasActiveDocument;
  const showSummary = !isLoading && hasActiveDocument && !isEditing;

  return (
    <Section data-testid="discharge-encounter-summary">
      <SectionTitle />
      <SectionAction>
        {showSummary && (
          <IconButton
            size="small"
            onClick={handleEdit}
            data-testid="encounter-summary-edit"
            aria-label="Edit"
          >
            <StyledEditIcon fontSize="small" />
          </IconButton>
        )}
        {isEditing && (
          <EditActions>
            <CancelButton
              onClick={handleCancel}
              disabled={isBusy}
              data-testid="encounter-summary-cancel"
            >
              <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
            </CancelButton>
            <SaveButton
              onClick={handleSave}
              disabled={isBusy}
              data-testid="encounter-summary-save"
            >
              <TranslatedText stringId="general.action.save" fallback="Save" />
            </SaveButton>
          </EditActions>
        )}
      </SectionAction>
      <Body>
        {isLoading && (
          <LoadingContainer>
            <CircularProgress size={20} />
          </LoadingContainer>
        )}
        {!isLoading && generateError && !hasActiveDocument && (
          <ErrorText>
            <TranslatedText
              stringId="ai.encounterSummary.error"
              fallback="Unable to generate summary. Please check your connection and try again."
            />
          </ErrorText>
        )}
        {showGenerate && !generateError && (
          <GenerateButton
            startIcon={<SparkleIcon />}
            onClick={handleGenerate}
            data-testid="encounter-summary-generate"
          >
            <TranslatedText
              stringId="ai.encounterSummary.action.generate"
              fallback="Generate AI summary"
            />
          </GenerateButton>
        )}
        {showSummary && (
          <>
            <SummaryBox>
              <SummaryText>{summary}</SummaryText>
            </SummaryBox>
            <SummaryFooter>
              <Disclaimer>
                <TranslatedText
                  stringId="ai.encounterSummary.disclaimer"
                  fallback="This is AI generated and may contain inaccuracies. Please check carefully."
                />
                {isHumanEdited && (
                  <EditedText>
                    <TranslatedText stringId="ai.encounterSummary.edited" fallback="(edited)" />
                  </EditedText>
                )}
              </Disclaimer>
              <DiscardButton
                onClick={() => setIsDiscardConfirmOpen(true)}
                startIcon={<DeleteOutlineIcon fontSize="small" />}
                disabled={isBusy}
                data-testid="encounter-summary-discard"
              >
                <TranslatedText stringId="ai.encounterSummary.action.discard" fallback="Discard" />
              </DiscardButton>
            </SummaryFooter>
          </>
        )}
        {isEditing && (
          <EditTextarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            disabled={isBusy}
            data-testid="encounter-summary-textarea"
          />
        )}
      </Body>
      <DiscardAiSummaryConfirmModal
        open={isDiscardConfirmOpen}
        onCancel={() => setIsDiscardConfirmOpen(false)}
        onConfirm={handleConfirmDiscard}
        isDiscarding={isDiscarding}
      />
    </Section>
  );
};
