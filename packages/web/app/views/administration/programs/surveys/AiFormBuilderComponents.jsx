import AddIcon from '@mui/icons-material/Add';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import { IconButton, Tooltip } from '@material-ui/core';
import React, { useMemo } from 'react';
import styled, { keyframes } from 'styled-components';

import { PROGRAM_DATA_ELEMENT_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import {
  AutocompleteInput,
  Button,
  Form,
  OutlinedButton,
  SurveyScreenPaginator,
  TAMANU_COLORS,
  TextInput,
  TranslatedText,
  useTranslation,
} from '@tamanu/ui-components';
import { ConfirmModal } from '../../../../components/ConfirmModal';
import { ClipIcon } from '../../../../components/Icons';
import { getComponentForQuestionType } from '../../../../components/Surveys';
import { Article } from '../components';

const PREVIEW_SELECT_OPTIONS = ['Yes', 'No', 'Prefer not to say'];
const EMPTY_FORM_VALUES = {};
const noopAsync = async () => {};

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
  padding: 28px 24px 8px;
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

const UserMessageText = styled.div`
  margin-block-end: 6px;
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
  inline-size: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'min(100%, 310px)')};
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
  block-size: 48px;
  border-radius: 3px;
  inline-size: 58px;
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
`;

const RippleRing = styled.div`
  animation: ${pulse} 1.5s cubic-bezier(0, 0.2, 0.8, 1) infinite;
  animation-delay: ${({ $delay }) => $delay};
  border: 2px solid ${TAMANU_COLORS.primary};
  border-radius: 50%;
  inset: 0;
  position: absolute;
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
  border-inline-start: 1px solid ${TAMANU_COLORS.outline};
  display: flex;
  flex-direction: column;
  min-block-size: 0;
  overflow: hidden;
`;

const PreviewHeader = styled.div`
  align-items: center;
  border-block-end: 1px solid ${TAMANU_COLORS.outline};
  display: grid;
  grid-template-columns: auto 1fr auto;
  min-block-size: 48px;
  padding: 0 20px;
`;

const PreviewTitleHeader = styled(PreviewHeader)`
  border-block-end: 0;
  grid-template-columns: 56px 1fr 56px;
  min-block-size: 66px;
  padding: 0 28px;
`;

const PreviewHeaderSpacer = styled.div`
  block-size: 1px;
  inline-size: 24px;
`;

const PreviewHeading = styled.div`
  color: ${TAMANU_COLORS.darkText};
  font-size: 14px;
  font-weight: 500;
  justify-self: center;
`;

const PreviewFormTitle = styled.h2`
  color: ${TAMANU_COLORS.darkText};
  font-size: 16px;
  font-weight: 500;
  line-height: 1.3;
  margin: 0;
  text-align: center;
`;

const PreviewProgress = styled.div`
  display: grid;
  gap: 3px;
  grid-template-columns: repeat(${({ $segments }) => $segments}, 1fr);
`;

const PreviewProgressSegment = styled.div`
  background: ${({ $active }) => ($active ? TAMANU_COLORS.primary : TAMANU_COLORS.midText)};
  block-size: 5px;
`;

const PreviewBody = styled.div`
  flex: 1;
  min-block-size: 0;
  overflow-y: auto;
  padding: 28px 18px 0;
`;

const PreviewSurveyWrap = styled.div`
  margin-block-start: 14px;
  padding-block-end: 42px;
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
  font-size: 14px;
`;

const SaveButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const PreviewSubmitTooltipTarget = styled.div`
  display: inline-flex;
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

const createPreviewSurvey = form => ({
  id: 'ai-form-builder-preview',
  name: form.title,
  components: form.sections.flatMap((section, sectionIndex) => [
    {
      id: `ai-preview-section-${sectionIndex}`,
      dataElementId: `ai-preview-section-${sectionIndex}`,
      screenIndex: sectionIndex,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      dataElement: {
        id: `ai-preview-section-${sectionIndex}`,
        type: PROGRAM_DATA_ELEMENT_TYPES.INSTRUCTION,
        defaultText: section.title,
      },
    },
    ...section.questions.map((question, questionIndex) => {
      const id = `ai-preview-question-${sectionIndex}-${questionIndex}`;
      return {
        id,
        dataElementId: id,
        screenIndex: sectionIndex,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        dataElement: {
          id,
          type: PROGRAM_DATA_ELEMENT_TYPES.SELECT,
          defaultText: question,
          defaultOptions: PREVIEW_SELECT_OPTIONS,
        },
      };
    }),
  ]),
});

const getPreviewScreenCount = survey =>
  Math.max(1, ...survey.components.map(component => component.screenIndex + 1));

function PreviewSubmitButton() {
  return (
    <Tooltip
      title={
        <TranslatedText
          stringId="admin.programs.aiFormBuilder.preview.submit.tooltip"
          fallback="This is a preview only. No data can be submitted."
        />
      }
    >
      <PreviewSubmitTooltipTarget>
        <Button color="primary" variant="contained" functionallyDisabled>
          <TranslatedText stringId="general.action.submit" fallback="Submit" />
        </Button>
      </PreviewSubmitTooltipTarget>
    </Tooltip>
  );
}

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
      {message.text && <UserMessageText>{message.text}</UserMessageText>}
      {message.file && <Attachment file={message.file} />}
    </UserMessage>
  );
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
  const previewSurvey = useMemo(() => (form ? createPreviewSurvey(form) : null), [form]);

  if (!form) return null;

  const screenCount = getPreviewScreenCount(previewSurvey);

  return (
    <PreviewColumn>
      <PreviewHeader>
        <PreviewHeaderSpacer aria-hidden="true" />
        <PreviewHeading>
          <TranslatedText
            stringId="admin.programs.aiFormBuilder.preview.heading"
            fallback="Form preview"
          />
        </PreviewHeading>
        <PreviewHeaderSpacer aria-hidden="true" />
      </PreviewHeader>
      <PreviewTitleHeader>
        <ArrowBackIosNewIcon htmlColor={TAMANU_COLORS.primary} fontSize="small" />
        <PreviewFormTitle>{form.title}</PreviewFormTitle>
        <PreviewHeaderSpacer aria-hidden="true" />
      </PreviewTitleHeader>
      <PreviewProgress $segments={screenCount} aria-hidden="true">
        {Array.from({ length: screenCount }, (_, index) => (
          <PreviewProgressSegment key={index} $active={index === 0} />
        ))}
      </PreviewProgress>
      <PreviewBody>
        <PreviewSurveyWrap>
          <Form
            initialValues={EMPTY_FORM_VALUES}
            onSubmit={noopAsync}
            render={({ values, setFieldValue, validateForm, setErrors, errors, setStatus, status }) => (
              <SurveyScreenPaginator
                survey={previewSurvey}
                values={values}
                setFieldValue={setFieldValue}
                onSurveyComplete={noopAsync}
                validateForm={validateForm}
                setErrors={setErrors}
                errors={errors}
                setStatus={setStatus}
                status={status}
                getComponentForQuestionType={getComponentForQuestionType}
                summarySubmitButton={<PreviewSubmitButton />}
              />
            )}
          />
        </PreviewSurveyWrap>
      </PreviewBody>
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
