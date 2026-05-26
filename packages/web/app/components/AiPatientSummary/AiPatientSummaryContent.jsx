import React from 'react';
import styled from 'styled-components';
import { IconButton } from '@material-ui/core';
import CircularProgress from '@material-ui/core/CircularProgress';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import SyncIcon from '@mui/icons-material/Sync';

import { Button, TextButton } from '@tamanu/ui-components';

import { Colors } from '../../constants';
import { BodyText } from '../Typography';
import { TranslatedText } from '../Translation/TranslatedText';

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
  font-size: 11px;
  color: ${Colors.darkText};
  font-weight: 500;
`;

const EditedText = styled.span`
  display: block;
`;

const StyledEditIcon = styled(EditIcon)`
  width: 5px;
  height: 5px;
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
  text-decoration: underline;

  .MuiButton-startIcon {
    margin-right: 4px;
  }
  &:hover {
    text-decoration: underline;
  }

  & .MuiButton-iconSizeMedium > *:first-of-type {
    font-size: 15px;
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
  color: ${({ $error }) => ($error ? Colors.alert : Colors.darkText)};
  font-size: 14px;
  text-align: center;
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

  & .MuiButton-iconSizeMedium > *:first-of-type {
    font-size: 15px;
  }
`;

const ErrorMessage = ({ error }) => {
  const status = error?.status;
  if (status === 403) {
    return (
      <TranslatedText
        stringId="ai.patientSummary.error.unavailable"
        fallback="AI summary is unavailable. Please contact your administrator."
      />
    );
  }

  return (
    <TranslatedText
      stringId="ai.patientSummary.error"
      fallback="Unable to generate summary. Please try again."
    />
  );
};

export const AiPatientSummaryContent = ({
  editContent,
  error,
  isBusy,
  isDiscarded,
  isEditing,
  isHumanEdited,
  isLoading,
  onCancel,
  onDiscard,
  onEdit,
  onRegenerate,
  onSave,
  setEditContent,
  summary,
}) => (
  <Content>
    {isLoading && (
      <LoadingContainer>
        <CircularProgress size={20} />
      </LoadingContainer>
    )}
    {!isLoading && (error || isDiscarded) && (
      <DiscardedBox>
        <DiscardedText $error={Boolean(error)}>
          {error ? (
            <ErrorMessage error={error} />
          ) : (
            <TranslatedText
              stringId="ai.patientSummary.discarded"
              fallback="AI patient summary has been discarded"
            />
          )}
        </DiscardedText>
        <RegenerateButton
          onClick={onRegenerate}
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
          <IconButton size="small" onClick={onEdit} data-testid="ai-summary-edit">
            <StyledEditIcon fontSize="small" />
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
            onClick={onDiscard}
            disabled={isBusy}
            startIcon={<DeleteOutlineIcon fontSize="small" />}
            data-testid="ai-summary-discard"
          >
            <TranslatedText stringId="ai.patientSummary.action.discard" fallback="Discard" />
          </DiscardButton>
          <EditActionsRight>
            <CancelButton onClick={onCancel} disabled={isBusy} data-testid="ai-summary-cancel">
              <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
            </CancelButton>
            <SaveButton
              onClick={onSave}
              disabled={isBusy || !editContent?.trim()}
              data-testid="ai-summary-save"
            >
              <TranslatedText stringId="general.action.save" fallback="Save" />
            </SaveButton>
          </EditActionsRight>
        </EditActions>
      </>
    )}
  </Content>
);
