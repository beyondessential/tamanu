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
  padding-top: 16px;
`;

const Box = styled.div`
  box-sizing: border-box;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  background: ${Colors.background};
`;

const SummaryBox = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
`;

const SummaryText = styled(BodyText)`
  color: ${Colors.darkestText};
  font-size: 14px;
  line-height: 18px;
  white-space: pre-wrap;
`;

const Footer = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;

  .MuiIconButton-root {
    padding: 0;
  }
`;

const Disclaimer = styled.div`
  color: ${Colors.darkestText};
  font-size: 11px;
  font-weight: 500;
  line-height: 15px;
`;

const StyledEditIcon = styled(EditIcon)`
  color: ${Colors.primary};
  font-size: 20px;
`;

const EditBox = styled(Box)`
  padding: 8px;
`;

const EditTextarea = styled.textarea`
  box-sizing: border-box;
  width: 100%;
  min-height: 146px;
  padding: 10px 16px;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  background: ${Colors.white};
  color: ${Colors.darkestText};
  font-family: inherit;
  font-size: 14px;
  line-height: 18px;
  resize: vertical;
  outline: none;

  &:focus {
    border-color: ${Colors.primary};
  }
`;

const EditActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
`;

const EditActionsRight = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LinkButton = styled(TextButton)`
  min-width: 0;
  padding: 0;
  font-size: 14px;
  line-height: 18px;
  text-transform: none;

  .MuiButton-startIcon {
    margin-right: 4px;
  }

  & .MuiButton-iconSizeMedium > *:first-of-type {
    font-size: 12px;
  }

  :hover {
    font-weight: inherit;
  }
`;

const DiscardButton = styled(LinkButton)`
  color: ${Colors.darkestText};
  font-weight: 400;
  text-decoration: underline;

  :hover {
    color: ${Colors.darkestText};
    text-decoration: underline;
  }
`;

const CancelButton = styled(LinkButton)`
  color: ${Colors.primary};
  font-weight: 500;
`;

const SaveButton = styled(Button)`
  height: 36px;
  min-width: 0;
  padding: 8px 16px;
  border-radius: 3px;
  font-size: 14px;
  line-height: 18px;
  text-transform: none;
`;

const LoadingContainer = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
`;

const DiscardedBox = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px;
`;

const DiscardedText = styled.p`
  margin: 0;
  color: ${({ $error }) => ($error ? Colors.alert : Colors.darkestText)};
  font-size: 14px;
  line-height: 18px;
  text-align: center;
`;

const RegenerateButton = styled(LinkButton)`
  align-self: center;
  color: ${Colors.primary};
  font-weight: 500;
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
              <>
                {' '}
                <TranslatedText stringId="ai.patientSummary.edited" fallback="(edited)" />
              </>
            )}
          </Disclaimer>
          <IconButton size="small" onClick={onEdit} data-testid="ai-summary-edit">
            <StyledEditIcon />
          </IconButton>
        </Footer>
      </SummaryBox>
    )}
    {isEditing && (
      <EditBox>
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
      </EditBox>
    )}
  </Content>
);
