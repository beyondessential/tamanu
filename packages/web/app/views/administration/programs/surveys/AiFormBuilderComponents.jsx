import AddIcon from '@mui/icons-material/Add';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import { IconButton } from '@material-ui/core';
import React from 'react';
import styled, { keyframes } from 'styled-components';

import {
  AutocompleteInput,
  Button,
  OutlinedButton,
  SelectInput,
  TAMANU_COLORS,
  TextInput,
  TranslatedText,
  useTranslation,
} from '@tamanu/ui-components';
import { ConfirmModal } from '../../../../components/ConfirmModal';
import { Article } from '../components';

export const BuilderArticle = styled(Article)`
  display: flex;
  flex: 1;
  min-block-size: 0;
  overflow: hidden;
  padding: 0;
`;

export const BuilderShell = styled.div`
  background: ${TAMANU_COLORS.background2};
  display: grid;
  flex: 1;
  grid-template-columns: ${({ $showPreview }) =>
    $showPreview ? 'minmax(420px, 0.9fr) 1.1fr' : '1fr'};
  min-block-size: 0;
  padding-inline: ${({ $showPreview }) => ($showPreview ? '0' : '20px')};
`;

export const ChatColumn = styled.section`
  border-inline-end: ${({ $showPreview }) =>
    $showPreview ? `1px solid ${TAMANU_COLORS.outline}` : 'none'};
  display: flex;
  justify-content: center;
  min-block-size: 0;
  overflow: hidden;
  transition: border-color 180ms ease-out;
`;

export const ChatStack = styled.div`
  block-size: ${({ $showPreview }) => ($showPreview ? '100%' : 'calc(100% - 22px)')};
  display: flex;
  flex-direction: column;
  gap: 10px;
  inline-size: min(100%, ${({ $showPreview }) => ($showPreview ? '100%' : '530px')});
  margin: ${({ $showPreview }) => ($showPreview ? '0' : '22px auto 0')};
  min-block-size: 0;
  transition:
    inline-size 180ms ease-out,
    margin 180ms ease-out;
`;

export const ChatPanel = styled.div`
  background: ${TAMANU_COLORS.white};
  border: ${({ $showPreview }) => ($showPreview ? 'none' : `1px solid ${TAMANU_COLORS.outline}`)};
  display: flex;
  flex: 1;
  flex-direction: column;
  min-block-size: 0;
  padding: 28px 24px 12px;
`;

export const Messages = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 24px;
  min-block-size: 0;
  overflow-y: auto;
  padding-block-end: 18px;
`;

export const IntroText = styled.p`
  color: ${TAMANU_COLORS.darkestText};
  font-size: 14px;
  line-height: 1.35;
  margin: 0;
  max-inline-size: 420px;
`;

export const MessageText = styled.p`
  color: ${TAMANU_COLORS.darkestText};
  font-size: 14px;
  line-height: 1.4;
  margin: 0;
`;

const UserMessage = styled.div`
  align-self: flex-end;
  background: ${TAMANU_COLORS.background2};
  border: 1px solid ${TAMANU_COLORS.outline};
  border-radius: 10px;
  color: ${TAMANU_COLORS.darkestText};
  font-size: 14px;
  line-height: 1.4;
  max-inline-size: 78%;
  padding: 14px 18px;
`;

const AttachmentChip = styled.div`
  align-items: center;
  background: ${TAMANU_COLORS.background2};
  border: 1px solid ${TAMANU_COLORS.outline};
  border-radius: 8px;
  color: ${TAMANU_COLORS.darkestText};
  display: flex;
  font-size: 14px;
  font-weight: 500;
  gap: 8px;
  min-block-size: 42px;
  min-inline-size: 0;
  padding: 0 14px;
`;

const AttachmentPanel = styled.div`
  align-self: flex-end;
  border: ${({ $sent }) => ($sent ? `1px solid ${TAMANU_COLORS.outline}` : 'none')};
  border-radius: 9px;
  display: grid;
  gap: 8px;
  inline-size: min(100%, 310px);
  padding: ${({ $sent }) => ($sent ? '14px' : '0')};
`;

export const PendingAttachmentRow = styled.div`
  display: grid;
  gap: 8px;
`;

export const AttachmentLabel = styled.div`
  color: ${TAMANU_COLORS.darkText};
  font-size: 13px;
  font-weight: 500;
`;

const RemoveAttachmentButton = styled.button`
  appearance: none;
  background: transparent;
  border: 0;
  color: ${TAMANU_COLORS.darkText};
  cursor: pointer;
  margin-inline-start: auto;
  padding: 0;

  svg {
    display: block;
    font-size: 18px;
  }
`;

const ProgramQuestion = styled.div`
  display: grid;
  gap: 18px;
`;

const ProgramSelectWrap = styled.div`
  justify-self: center;
  inline-size: min(100%, 390px);
`;

const ComposerWrap = styled.div`
  border: 1px solid ${TAMANU_COLORS.outline};
  border-radius: 10px;
  margin-block-start: auto;
  padding: 0;
`;

const StyledTextInput = styled(TextInput)`
  .MuiOutlinedInput-root {
    align-items: flex-start;
    border-radius: 10px;
    min-block-size: 118px;
    padding-block-end: 54px;
  }

  .MuiOutlinedInput-notchedOutline {
    border: 0;
  }

  .MuiInputBase-input {
    padding: 15px 17px;
  }
`;

const ComposerActions = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-block-start: -50px;
  padding: 0 10px 10px 14px;
  pointer-events: none;
  position: relative;
  z-index: 1;
`;

const ComposerIconButton = styled(IconButton)`
  border-radius: 3px;
  block-size: 42px;
  inline-size: 42px;
  pointer-events: auto;
`;

const AttachButton = styled(ComposerIconButton)`
  color: ${TAMANU_COLORS.primary};

  svg {
    font-size: 25px;
  }
`;

const SendButton = styled(ComposerIconButton)`
  && {
    background: ${({ disabled, $isThinking }) =>
      disabled && !$isThinking ? TAMANU_COLORS.primary30 : TAMANU_COLORS.primary};
  }
  color: ${TAMANU_COLORS.white};

  &&:hover {
    background: ${({ disabled, $isThinking }) =>
      disabled && !$isThinking ? TAMANU_COLORS.primary30 : TAMANU_COLORS.primaryDark};
  }

  svg {
    font-size: 22px;
  }
`;

export const Disclaimer = styled.p`
  color: ${TAMANU_COLORS.midText};
  font-size: 11px;
  line-height: 1.3;
  margin: 0 0 10px;
  text-align: center;
`;

const pulse = keyframes`
  0% {
    opacity: 0.8;
    transform: scale(0.25);
  }
  80%, 100% {
    opacity: 0;
    transform: scale(1);
  }
`;

const ThinkingWrap = styled.div`
  align-items: center;
  display: flex;
  gap: 12px;
`;

const Ripple = styled.div`
  block-size: 42px;
  inline-size: 42px;
  position: relative;

  span {
    animation: ${pulse} 1.5s cubic-bezier(0, 0.2, 0.8, 1) infinite;
    border: 2px solid ${TAMANU_COLORS.primary};
    border-radius: 50%;
    inset: 0;
    position: absolute;
  }

  span:nth-child(2) {
    animation-delay: -0.75s;
  }
`;

const previewEnter = keyframes`
  from {
    opacity: 0;
    transform: translateX(18px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const PreviewColumn = styled.aside`
  animation: ${previewEnter} 220ms ease-out;
  background: ${TAMANU_COLORS.white};
  display: flex;
  flex-direction: column;
  min-block-size: 0;
  overflow: auto;
`;

const PreviewHeader = styled.div`
  align-items: center;
  border-block-end: 1px solid ${TAMANU_COLORS.outline};
  display: grid;
  grid-template-columns: auto 1fr auto;
  min-block-size: 54px;
  padding: 0 20px;
`;

const PreviewHeading = styled.div`
  color: ${TAMANU_COLORS.darkText};
  font-size: 13px;
  justify-self: center;
`;

const PreviewFormTitle = styled.h2`
  color: ${TAMANU_COLORS.darkText};
  font-size: 14px;
  font-weight: 500;
  margin: 0;
`;

const StepBar = styled.div`
  display: grid;
  gap: 3px;
  grid-template-columns: repeat(6, 1fr);
  padding-inline: 0;

  span {
    background: ${TAMANU_COLORS.midText};
    block-size: 5px;
  }

  span:nth-child(-n + 2) {
    background: ${TAMANU_COLORS.primary};
  }
`;

const PreviewBody = styled.div`
  display: grid;
  gap: 18px;
  padding: 28px 18px;
`;

const PreviewSectionTitle = styled.h3`
  color: ${TAMANU_COLORS.darkestText};
  font-size: 15px;
  font-weight: 500;
  margin: 0;
`;

const PreviewField = styled.label`
  color: ${TAMANU_COLORS.darkText};
  display: grid;
  font-size: 13px;
  gap: 7px;
`;

const Required = styled.span`
  color: ${TAMANU_COLORS.alert};
`;

const PreviewFooter = styled.div`
  display: flex;
  justify-content: space-between;
  margin-block-start: auto;
  padding: 18px;
`;

const DownloadCard = styled.div`
  align-items: center;
  border: 1px solid ${TAMANU_COLORS.outline};
  border-radius: 10px;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 12px 14px;
`;

const DownloadFileName = styled.span`
  color: ${TAMANU_COLORS.darkestText};
  font-weight: 500;
`;

const SaveButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const NewChatModalBody = styled.div`
  align-items: center;
  color: ${TAMANU_COLORS.darkestText};
  display: flex;
  font-size: 14px;
  line-height: 1.45;
  min-block-size: 128px;
  padding: 20px 64px;
  text-align: left;
`;

export function Attachment({ file, sent = false, onRemove }) {
  return (
    <AttachmentPanel $sent={sent}>
      {sent && (
        <AttachmentLabel>
          <TranslatedText
            stringId="admin.programs.aiFormBuilder.attachmentSent.label"
            fallback="The form is attached"
          />
        </AttachmentLabel>
      )}
      <AttachmentChip>
        <AttachFileIcon fontSize="small" />
        {file.name}
        {onRemove && (
          <RemoveAttachmentButton type="button" onClick={onRemove}>
            <CloseIcon />
          </RemoveAttachmentButton>
        )}
      </AttachmentChip>
    </AttachmentPanel>
  );
}

export function UserMessageContent({ message }) {
  if (!message.text && message.file) {
    return <Attachment file={message.file} />;
  }

  return (
    <UserMessage>
      {message.text && <div>{message.text}</div>}
      {message.file && <Attachment file={message.file} />}
    </UserMessage>
  );
}

export function ThinkingMessage() {
  return (
    <ThinkingWrap>
      <Ripple aria-hidden="true">
        <span />
        <span />
      </Ripple>
      <MessageText>
        <TranslatedText
          stringId="admin.programs.aiFormBuilder.thinking.label"
          fallback="Building your form..."
        />
      </MessageText>
    </ThinkingWrap>
  );
}

export function ProgramQuestionMessage({ value, onChange, programOptions }) {
  const { getTranslation } = useTranslation();

  return (
    <ProgramQuestion>
      <MessageText>
        <TranslatedText
          stringId="admin.programs.aiFormBuilder.programQuestion"
          fallback="Which program would you like to attach the form to?"
        />
      </MessageText>
      <ProgramSelectWrap>
        <AutocompleteInput
          name="programId"
          value={value}
          onChange={event => onChange(event.target.value)}
          options={programOptions}
          placeholder={getTranslation(
            'admin.programs.aiFormBuilder.program.placeholder',
            'Search for a program',
          )}
          data-testid="ai-form-builder-program-select"
        />
      </ProgramSelectWrap>
    </ProgramQuestion>
  );
}

export function DownloadMessage({ fileName, onDownload, onSave }) {
  return (
    <>
      <MessageText>
        <TranslatedText
          stringId="admin.programs.aiFormBuilder.readyMessage"
          fallback="Your form is ready for preview and the xlsx file can be downloaded if you wish. Would you like to save this new form to the database?"
        />
      </MessageText>
      <DownloadCard>
        <DownloadFileName>{fileName}</DownloadFileName>
        <OutlinedButton size="small" startIcon={<DownloadIcon />} onClick={onDownload}>
          <TranslatedText stringId="general.action.download" fallback="Download" />
        </OutlinedButton>
      </DownloadCard>
      <SaveButtonRow>
        <Button size="small" onClick={onSave}>
          <TranslatedText
            stringId="admin.programs.aiFormBuilder.saveToDatabase.action"
            fallback="Save to database"
          />
        </Button>
      </SaveButtonRow>
    </>
  );
}

export function ChatComposer({
  acceptedFileExtensions,
  getTranslation,
  handleDrop,
  handleFileSelected,
  handleStop,
  handleSubmit,
  inputFileRef,
  inputValue,
  isThinking,
  openFileDialog,
  sendDisabled,
  setInputValue,
}) {
  return (
    <ComposerWrap onDragOver={event => event.preventDefault()} onDrop={handleDrop}>
      <StyledTextInput
        multiline
        minRows={3}
        value={inputValue}
        onChange={event => setInputValue(event.target.value)}
        onDrop={handleDrop}
        onDragOver={event => event.preventDefault()}
        placeholder={getTranslation(
          'admin.programs.aiFormBuilder.input.placeholder',
          'Start typing here or attach a file containing the form...',
        )}
        enablePasting
        data-testid="ai-form-builder-input"
      />
      <ComposerActions>
        <input
          ref={inputFileRef}
          type="file"
          accept={acceptedFileExtensions.map(extension => `.${extension}`).join(',')}
          onChange={handleFileSelected}
          hidden
        />
        <AttachButton
          type="button"
          title={getTranslation(
            'admin.programs.aiFormBuilder.attach.tooltip',
            'Attach pdf, png, jpg, jpeg, csv, xls or xlsx',
          )}
          onClick={openFileDialog}
        >
          <AddIcon />
        </AttachButton>
        <SendButton
          type="button"
          disabled={!isThinking && sendDisabled}
          $isThinking={isThinking}
          onClick={isThinking ? handleStop : handleSubmit}
        >
          {isThinking ? <StopRoundedIcon /> : <ArrowUpwardIcon />}
        </SendButton>
      </ComposerActions>
    </ComposerWrap>
  );
}

export function FormPreview({ form }) {
  if (!form) return null;

  const section = form.sections[0];

  return (
    <PreviewColumn>
      <PreviewHeader>
        <ArrowBackIosNewIcon htmlColor={TAMANU_COLORS.primary} fontSize="small" />
        <PreviewHeading>
          <TranslatedText
            stringId="admin.programs.aiFormBuilder.preview.heading"
            fallback="Form preview"
          />
        </PreviewHeading>
        <span />
      </PreviewHeader>
      <PreviewHeader>
        <span />
        <PreviewFormTitle>{form.title}</PreviewFormTitle>
        <span />
      </PreviewHeader>
      <StepBar aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </StepBar>
      <PreviewBody>
        <PreviewSectionTitle>{section.title}</PreviewSectionTitle>
        {section.questions.map((question, index) => (
          <PreviewField key={`${question}-${index}`}>
            <span>
              {question}
              <Required>*</Required>
            </span>
            <SelectInput
              name={`preview-${index}`}
              value=""
              onChange={() => {}}
              options={[]}
              disabled
              data-testid={`ai-form-builder-preview-select-${index}`}
            />
          </PreviewField>
        ))}
      </PreviewBody>
      <PreviewFooter>
        <OutlinedButton>
          <TranslatedText stringId="general.action.back" fallback="Back" />
        </OutlinedButton>
        <Button>
          <TranslatedText stringId="general.action.next" fallback="Next" />
        </Button>
      </PreviewFooter>
    </PreviewColumn>
  );
}

export function NewChatConfirmModal({ open, onCancel, onConfirm }) {
  return (
    <ConfirmModal
      open={open}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={
        <TranslatedText
          stringId="admin.programs.aiFormBuilder.newChat.title"
          fallback="New chat"
        />
      }
      customContent={
        <NewChatModalBody>
          <TranslatedText
            stringId="admin.programs.aiFormBuilder.newChat.confirmText"
            fallback="Starting a new chat will clear your existing chat. Are you sure you wish to continue?"
          />
        </NewChatModalBody>
      }
      confirmButtonText={
        <TranslatedText
          stringId="admin.programs.aiFormBuilder.newChat.confirmAction"
          fallback="Start new chat"
        />
      }
    />
  );
}
