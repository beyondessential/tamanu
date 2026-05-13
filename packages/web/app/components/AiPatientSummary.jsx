import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Box, Collapse, IconButton } from '@material-ui/core';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SyncIcon from '@mui/icons-material/Sync';
import CircularProgress from '@material-ui/core/CircularProgress';

import { Button, TextButton } from '@tamanu/ui-components';

import { Colors } from '../constants';
import { Heading4, BodyText } from './Typography';
import { TranslatedText } from './Translation/TranslatedText';
import { useAiPatientSummaryQuery } from '../api/queries/useAiPatientSummaryQuery';
import {
  useGenerateAiPatientSummary,
  useSaveAiPatientSummary,
  useDiscardAiPatientSummary,
} from '../api/mutations/useAiPatientSummaryMutation';

const Container = styled.div`
  background: ${Colors.white};
  border-bottom: 1px solid ${Colors.outline};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 25px;
  cursor: pointer;
  user-select: none;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SparkleIcon = styled(AutoAwesomeIcon)`
  color: ${Colors.metallicYellow};
  font-size: 20px;
`;

const Title = styled(Heading4)`
  color: ${Colors.primary};
  margin: 0;
`;

const Content = styled.div`
  padding: 0 23px 16px;
`;

const SummaryBox = styled.div`
  background: ${Colors.background2};
  border: 1px solid ${Colors.softOutline};
  border-radius: 4px;
  padding: 12px;
`;

const SummaryText = styled(BodyText)`
  color: ${Colors.darkestText};
  line-height: 22px;
  white-space: pre-wrap;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 8px;
`;

const Disclaimer = styled.p`
  font-size: 12px;
  color: ${Colors.darkText};
  font-weight: 500;
`;

const EditedText = styled.span`
  display: block;
`;

const StyledEditIcon = styled(EditIcon)`
  font-size: 10px;
  color: ${Colors.primary};
`;

const EditTextarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 1px solid ${Colors.primary};
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
  line-height: 22px;
  color: ${Colors.darkestText};
  resize: vertical;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: ${Colors.primary};
    box-shadow: 0 0 0 1px ${Colors.primary};
  }
`;

const EditActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
`;

const EditActionsRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DiscardButton = styled(TextButton)`
  color: ${Colors.darkText};
  font-size: 14px;
  padding: 4px 8px;
  text-transform: none;
  min-width: 0;

  .MuiButton-startIcon {
    margin-right: 4px;
  }
`;

const SaveButton = styled(Button)`
  font-size: 14px;
  padding: 10px 16px;
  text-transform: none;
  min-width: 0;
`;

const CancelButton = styled(TextButton)`
  font-size: 14px;
  padding: 4px 8px;
  text-transform: none;
  min-width: 0;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${Colors.background2};
  border: 1px solid ${Colors.softOutline};
  border-radius: 4px;
  min-height: 96px;
`;

const ErrorText = styled(BodyText)`
  color: ${Colors.alert};
`;

const DiscardedBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: ${Colors.background2};
  border: 1px solid ${Colors.softOutline};
  border-radius: 4px;
  padding: 12px;
`;

const DiscardedText = styled.p`
  color: ${Colors.darkText};
  font-size: 14px;
`;

const RegenerateButton = styled(TextButton)`
  color: ${Colors.primary};
  font-size: 14px;
  padding: 4px 0;
  text-transform: none;
  min-width: 0;
  align-self: center;

  .MuiButton-startIcon {
    margin-right: 4px;
  }
`;

export const AiPatientSummary = ({ patient }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const attemptedRegenerationDocumentId = useRef(null);

  const {
    data: existingData,
    isLoading: isLoadingExisting,
    isFetched: hasCheckedForExisting,
  } = useAiPatientSummaryQuery(patient.id);

  const isDiscarded = existingData?.aiDocument?.status === 'discarded';

  const {
    mutate: generateSummary,
    data: generatedData,
    isLoading: isGenerating,
    error,
  } = useGenerateAiPatientSummary(patient.id);
  const generatedAiDocument = generatedData?.recordId === patient.id ? generatedData : null;

  const { mutate: saveSummary, isLoading: isSaving } = useSaveAiPatientSummary(patient.id);

  const { mutate: discardSummary, isLoading: isDiscarding } = useDiscardAiPatientSummary(patient.id);

  // Auto-generate only after confirming the server has no summary, or that it is stale.
  useEffect(() => {
    if (!hasCheckedForExisting || isGenerating || error) {
      return;
    }

    if (!existingData?.aiDocument) {
      if (generatedAiDocument) {
        return;
      }

      generateSummary();
      return;
    }

    if (
      existingData.requiresRegeneration &&
      attemptedRegenerationDocumentId.current !== existingData.aiDocument.id
    ) {
      attemptedRegenerationDocumentId.current = existingData.aiDocument.id;
      generateSummary();
    }
  }, [
    error,
    generateSummary,
    generatedAiDocument,
    hasCheckedForExisting,
    existingData?.aiDocument,
    existingData?.requiresRegeneration,
    isGenerating,
  ]);

  const hasExisting = existingData?.aiDocument && !isDiscarded;
  const noExistingSummary = hasCheckedForExisting && !existingData?.aiDocument;
  const pendingGeneration = noExistingSummary && !generatedAiDocument && !error;
  const isLoading = isLoadingExisting || isGenerating || pendingGeneration;
  const aiDocument = generatedAiDocument ?? existingData?.aiDocument;
  const documentId = generatedAiDocument?.id ?? existingData?.aiDocument?.id;
  const summary = generatedAiDocument?.content ?? (hasExisting ? existingData.aiDocument.content : null);
  const isHumanEdited = aiDocument?.source === 'human' && aiDocument?.status === 'edited';

  const handleEdit = () => {
    setEditContent(summary);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    if (documentId) {
      saveSummary({ id: documentId, content: editContent }, { onSuccess: () => setIsEditing(false) });
    }
  };

  const handleDiscard = () => {
    if (documentId) {
      discardSummary(documentId, { onSuccess: () => setIsEditing(false) });
    }
  };

  const handleRegenerate = () => {
    generateSummary();
  };

  const isBusy = isSaving || isDiscarding;

  // Don't render anything until we have content or are actively loading or discarded
  if (!isLoading && !summary && !error && !isDiscarded) return null;

  return (
    <Container data-testid="ai-patient-summary">
      <Header onClick={() => setIsOpen(prev => !prev)}>
        <HeaderLeft>
          <SparkleIcon data-testid="sparkle-icon" />
          <Title>
            <TranslatedText stringId="ai.patientSummary.title" fallback="AI patient summary" />
          </Title>
        </HeaderLeft>
        <IconButton size="small" data-testid="ai-summary-toggle">
          {isOpen ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Header>
      <Collapse in={isOpen}>
        <Content>
          {isLoading && (
            <LoadingContainer>
              <CircularProgress size={20} />
            </LoadingContainer>
          )}
          {!isLoading && error && !isDiscarded && (
            <Box p={2}>
              <ErrorText>
                <TranslatedText
                  stringId="ai.patientSummary.error"
                  fallback="Unable to generate summary. Please check your connection and try again."
                />
              </ErrorText>
            </Box>
          )}
          {!isLoading && isDiscarded && (
            <DiscardedBox>
              <DiscardedText>
                <TranslatedText
                  stringId="ai.patientSummary.discarded"
                  fallback="AI patient summary has been discarded"
                />
              </DiscardedText>
              <RegenerateButton
                onClick={handleRegenerate}
                startIcon={<SyncIcon fontSize="small" />}
                data-testid="ai-summary-regenerate"
              >
                <TranslatedText
                  stringId="ai.patientSummary.action.regenerate"
                  fallback="Regenerate AI summary"
                />
              </RegenerateButton>
            </DiscardedBox>
          )}
          {!isLoading && summary && !isEditing && !isDiscarded && (
            <SummaryBox>
              <SummaryText>{summary}</SummaryText>
              <Footer>
                <Disclaimer>
                  <TranslatedText
                    stringId="ai.patientSummary.disclaimer"
                    fallback="This is AI generated and may contain inaccuracies."
                  />
                  {isHumanEdited && (
                    <EditedText>
                      <TranslatedText stringId="ai.patientSummary.edited" fallback="(edited)" />
                    </EditedText>
                  )}
                </Disclaimer>
                <IconButton size="small" onClick={handleEdit} data-testid="ai-summary-edit">
                  <StyledEditIcon />
                </IconButton>
              </Footer>
            </SummaryBox>
          )}
          {isEditing && (
            <>
              <EditTextarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                disabled={isBusy}
                data-testid="ai-summary-textarea"
              />
              <EditActions>
                <DiscardButton
                  onClick={handleDiscard}
                  disabled={isBusy}
                  startIcon={<DeleteOutlineIcon fontSize="small" />}
                  data-testid="ai-summary-discard"
                >
                  <TranslatedText stringId="ai.patientSummary.action.discard" fallback="Discard" />
                </DiscardButton>
                <EditActionsRight>
                  <CancelButton
                    onClick={handleCancel}
                    disabled={isBusy}
                    data-testid="ai-summary-cancel"
                  >
                    <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
                  </CancelButton>
                  <SaveButton onClick={handleSave} disabled={isBusy} data-testid="ai-summary-save">
                    <TranslatedText stringId="general.action.save" fallback="Save" />
                  </SaveButton>
                </EditActionsRight>
              </EditActions>
            </>
          )}
        </Content>
      </Collapse>
    </Container>
  );
};
