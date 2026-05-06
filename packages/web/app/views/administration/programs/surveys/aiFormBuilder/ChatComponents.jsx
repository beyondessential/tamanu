import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import { IconButton } from '@mui/material';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styled, { keyframes } from 'styled-components';

import {
  AutocompleteInput,
  Button,
  OutlinedButton,
  TAMANU_COLORS,
  TextInput,
  TranslatedText,
  useTranslation,
} from '@tamanu/ui-components';
import { ConfirmModal } from '../../../../../components/ConfirmModal';
import { ClipIcon } from '../../../../../components/Icons';
import { Article } from '../../components';
import { DraftStatusBadge } from './DraftStatusBadge';

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
    $showPreview ? 'minmax(420px, 0.95fr) 1.05fr' : '1fr'};
  min-block-size: 0;
  padding-inline: ${({ $showPreview }) => ($showPreview ? '0' : '20px')};
`;

export const ChatColumn = styled.section`
  display: flex;
  justify-content: center;
  min-block-size: 0;
  overflow: hidden;
`;

export const ChatStack = styled.div`
  block-size: ${({ $showPreview }) => ($showPreview ? 'calc(100% - 28px)' : 'calc(100% - 22px)')};
  display: flex;
  flex-direction: column;
  gap: 10px;
  inline-size: min(100%, 530px);
  margin: ${({ $showPreview }) => ($showPreview ? '14px 20px 0' : '22px auto 0')};
  min-block-size: 0;
  transition:
    inline-size 180ms ease-out,
    margin 180ms ease-out;
`;

export const ChatPanel = styled.div`
  background: ${TAMANU_COLORS.white};
  border: 1px solid ${TAMANU_COLORS.outline};
  border-radius: 3px;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-block-size: 0;
  padding: 28px 24px 10px;
`;

export const Messages = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 24px;
  margin-inline-end: -10px;
  min-block-size: 0;
  overflow-y: auto;
  padding-block-end: 18px;
  padding-inline-end: 22px;
  scrollbar-gutter: stable;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    inline-size: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${TAMANU_COLORS.outline};
    border-radius: 999px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
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

const AssistantMessage = styled.div`
  color: ${TAMANU_COLORS.darkestText};
  font-size: 14px;
  line-height: 1.45;

  > *:first-child {
    margin-block-start: 0;
  }

  > *:last-child {
    margin-block-end: 0;
  }

  p,
  ul,
  ol {
    margin-block: 0 10px;
  }

  h1,
  h2,
  h3 {
    color: ${TAMANU_COLORS.darkestText};
    font-weight: 600;
    line-height: 1.3;
    margin-block: 0 8px;
  }

  h1 {
    font-size: 17px;
  }

  h2 {
    font-size: 16px;
  }

  h3 {
    font-size: 15px;
  }

  ul,
  ol {
    padding-inline-start: 22px;
  }

  li + li {
    margin-block-start: 6px;
  }

  code {
    background: ${TAMANU_COLORS.background2};
    border: 1px solid ${TAMANU_COLORS.outline};
    border-radius: 4px;
    font-family: monospace;
    font-size: 13px;
    padding: 1px 4px;
  }

  pre {
    background: ${TAMANU_COLORS.background2};
    border: 1px solid ${TAMANU_COLORS.outline};
    border-radius: 6px;
    overflow-x: auto;
    padding: 10px 12px;
  }

  pre code {
    background: transparent;
    border: 0;
    padding: 0;
  }
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

  ${AssistantMessage} {
    color: inherit;
  }
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
  min-block-size: ${({ $fullWidth }) => ($fullWidth ? '46px' : '42px')};
  min-inline-size: 0;
  padding: 0 14px;
`;

const AttachmentPanel = styled.div`
  align-self: ${({ $fullWidth }) => ($fullWidth ? 'stretch' : 'flex-end')};
  border: ${({ $sent }) => ($sent ? `1px solid ${TAMANU_COLORS.outline}` : 'none')};
  border-radius: 9px;
  display: grid;
  gap: 8px;

  padding: ${({ $sent }) => ($sent ? '14px' : '0')};
`;

export const PendingAttachmentRow = styled.div`
  display: grid;
  gap: 8px;
  margin-inline: -14px;
  margin-block-end: 14px;
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
  inline-size: min(100%, 310px);
  justify-self: end;
`;

const ComposerWrap = styled.div`
  margin-block-start: auto;
  margin-inline: -14px;
`;

const StyledTextInput = styled(TextInput)`
  && .MuiOutlinedInput-root {
    align-items: flex-start;
    border-radius: 10px;
    min-block-size: 118px;
    padding-block-end: 58px;
  }

  && .MuiOutlinedInput-notchedOutline,
  && .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline,
  && .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
    border-width: 1px;
  }

  && .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline,
  && .MuiOutlinedInput-root.Mui-focused:hover .MuiOutlinedInput-notchedOutline {
    border-color: ${TAMANU_COLORS.primary};
  }

  .MuiInputBase-input {
    max-block-size: 170px;
    overflow-y: auto !important;
    padding: 15px 17px;
  }

  .MuiInputBase-input::placeholder {
    color: ${TAMANU_COLORS.softText};
    font-size: 14px;
    opacity: 1;
  }
`;

const ComposerActions = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-block-start: -56px;
  padding: 0 10px 10px;
  pointer-events: none;
  position: relative;
  z-index: 1;
`;

const ComposerIconButton = styled(IconButton)`
  && {
    block-size: 44px;
    border-radius: 3px;
    inline-size: 62px;
    pointer-events: auto;
  }
`;

const AttachButton = styled(ComposerIconButton)`
  && {
    color: ${TAMANU_COLORS.primary};
  }

  svg {
    font-size: 25px;
  }
`;

const SendButton = styled(ComposerIconButton)`
  &&,
  &&.Mui-disabled {
    background: ${({ disabled, $isThinking }) =>
      disabled && !$isThinking ? TAMANU_COLORS.primary30 : TAMANU_COLORS.primary};
    color: ${TAMANU_COLORS.white};
  }

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
`;

const RippleRing = styled.div`
  animation: ${pulse} 1.5s cubic-bezier(0, 0.2, 0.8, 1) infinite;
  animation-delay: ${({ $delay }) => $delay};
  border: 2px solid ${TAMANU_COLORS.primary};
  border-radius: 50%;
  inset: 0;
  position: absolute;
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

const DownloadFileDetails = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-inline-size: 0;
`;

const DownloadFileName = styled.span`
  color: ${TAMANU_COLORS.darkestText};
  font-weight: 500;
  font-size: 14px;
`;

const SaveButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-inline-end: 14px;
`;

const DownloadButton = styled(OutlinedButton)`
  && {
    padding-block: 7px;
  }
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

const normaliseAssistantMarkdown = text =>
  text
    .trim()
    .replace(/:\s+([-*]\s+)/g, ':\n$1')
    .replace(/([^\n])\s+([-*]\s+)/g, '$1\n$2')
    .replace(/:\s+(\d+\.\s+)/g, ':\n$1')
    .replace(/([^\n])\s+(\d+\.\s+)/g, '$1\n$2');

export function Attachment({ file, sent = false, fullWidth = false, onRemove }) {
  return (
    <AttachmentPanel $sent={sent} $fullWidth={fullWidth}>
      {sent && (
        <AttachmentLabel>
          <TranslatedText
            stringId="admin.programs.aiFormBuilder.attachmentSent.label"
            fallback="The form is attached"
          />
        </AttachmentLabel>
      )}
      <AttachmentChip $fullWidth={fullWidth}>
        <ClipIcon />
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
      {message.text && <MarkdownMessageContent text={message.text} />}
      {message.file && <Attachment file={message.file} />}
    </UserMessage>
  );
}

function MarkdownMessageContent({ text }) {
  return (
    <AssistantMessage>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{normaliseAssistantMarkdown(text)}</ReactMarkdown>
    </AssistantMessage>
  );
}

export function AssistantMessageContent({ text }) {
  return <MarkdownMessageContent text={text} />;
}

export function ThinkingMessage() {
  return (
    <ThinkingWrap>
      <Ripple aria-hidden="true">
        <RippleRing $delay="0s" />
        <RippleRing $delay="-0.75s" />
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

export function DownloadMessage({ fileName, isSaved, isSaving, onDownload, onSave }) {
  return (
    <>
      <MessageText>
        <TranslatedText
          stringId="admin.programs.aiFormBuilder.readyMessage"
          fallback="A draft form is ready for preview. Review it before saving to the database or downloading the xlsx."
        />
      </MessageText>
      <DownloadCard>
        <DownloadFileDetails>
          <DownloadFileName>{fileName}</DownloadFileName>
          <DraftStatusBadge isSaved={isSaved} />
        </DownloadFileDetails>
        <DownloadButton size="small" startIcon={<DownloadIcon />} onClick={onDownload}>
          <TranslatedText stringId="general.action.download" fallback="Download" />
        </DownloadButton>
      </DownloadCard>
      <SaveButtonRow>
        <Button size="small" disabled={isSaving || isSaved} onClick={onSave}>
          {isSaved ? (
            <TranslatedText
              stringId="admin.programs.aiFormBuilder.saveToDatabase.saved"
              fallback="Saved"
            />
          ) : isSaving ? (
            <TranslatedText
              stringId="admin.programs.aiFormBuilder.saveToDatabase.saving"
              fallback="Saving..."
            />
          ) : (
            <TranslatedText
              stringId="admin.programs.aiFormBuilder.saveToDatabase.action"
              fallback="Save to database"
            />
          )}
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
  const handleKeyDown = event => {
    if (
      event.key !== 'Enter' ||
      event.shiftKey ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }

    event.preventDefault();
    if (!isThinking && !sendDisabled) {
      handleSubmit();
    }
  };

  return (
    <ComposerWrap onDragOver={event => event.preventDefault()} onDrop={handleDrop}>
      <StyledTextInput
        multiline
        minRows={3}
        rowsMax={8}
        value={inputValue}
        onChange={event => setInputValue(event.target.value)}
        onKeyDown={handleKeyDown}
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
