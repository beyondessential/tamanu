import AddIcon from '@mui/icons-material/Add';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import { IconButton } from '@material-ui/core';
import React from 'react';
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
import { getComponentForQuestionType } from '../../../../components/Surveys';
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
  padding: 0 ${({ $fullWidth }) => ($fullWidth ? '14px' : '14px')};
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
  justify-self: center;
  inline-size: min(100%, 390px);
`;

const ComposerWrap = styled.div`
  margin-inline: -14px;
  margin-block-start: auto;
  padding: 0;
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
  border-radius: 3px;
  block-size: 42px;
  inline-size: 42px;
  pointer-events: auto;
`;

const AttachButton = styled(ComposerIconButton)`
  block-size: 48px;
  color: ${TAMANU_COLORS.primary};
  inline-size: 58px;

  svg {
    font-size: 25px;
  }
`;

const SendButton = styled(ComposerIconButton)`
  && {
    background: ${({ disabled, $isThinking }) =>
      disabled && !$isThinking ? TAMANU_COLORS.primary30 : TAMANU_COLORS.primary};
    border-radius: 3px;
    block-size: 48px;
    inline-size: 58px;
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

const PreviewHeaderSpacer = styled.div`
  block-size: 1px;
  inline-size: 24px;
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

const PreviewProgress = styled.div`
  display: grid;
  gap: 3px;
  grid-template-columns: repeat(${({ $segments }) => $segments}, 1fr);
  padding-inline: 0;
`;

const PreviewProgressSegment = styled.div`
  background: ${({ $active }) => ($active ? TAMANU_COLORS.primary : TAMANU_COLORS.midText)};
  block-size: 5px;
`;

const PreviewBody = styled.div`
  display: grid;
  padding: 28px 18px 0;
`;

const PreviewSurveyWrap = styled.div`
  padding-block-end: 24px;
  margin-block-start: 14px;

  .MuiFormControl-root {
    pointer-events: none;
  }

  [data-testid='styledbuttonrow-pvdv'] {
    margin-block-end: 18px;
  }
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
        validationCriteria: JSON.stringify({ mandatory: true }),
        dataElement: {
          id,
          type: PROGRAM_DATA_ELEMENT_TYPES.SELECT,
          defaultText: question,
          defaultOptions: ['Yes', 'No', 'Prefer not to say'],
        },
      };
    }),
  ]),
});

const ClipIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12.6663 3.99967C12.6663 3.53572 12.5046 3.08857 12.2132 2.73275L12.0804 2.58561C11.7054 2.21092 11.1971 2.00041 10.667 2.00033C10.1368 2.00033 9.62796 2.21084 9.25293 2.58561L3.64746 8.30436L3.6429 8.30892C3.01774 8.93408 2.66636 9.78223 2.66634 10.6663C2.66634 11.5505 3.01772 12.3986 3.6429 13.0238C4.26808 13.6489 5.11623 14.0003 6.00033 14.0003C6.8843 14.0002 7.732 13.6488 8.3571 13.0238L13.5231 7.73405L13.9997 8.2002L14.4769 8.66569L9.2998 13.9671C9.29401 13.9731 9.28753 13.9784 9.28158 13.984C8.40819 14.848 7.22948 15.3336 6.00033 15.3337C4.76261 15.3337 3.57542 14.8416 2.7002 13.9665C1.82496 13.0912 1.33301 11.9041 1.33301 10.6663C1.33303 9.43081 1.8227 8.24553 2.69499 7.37077L8.30501 1.64746L8.31022 1.6429L8.43001 1.52897C9.04142 0.975581 9.83842 0.666992 10.667 0.666992C11.5507 0.667075 12.3981 1.01816 13.0231 1.6429H13.0238L13.1377 1.7627C13.6911 2.3741 13.9997 3.17109 13.9997 3.99967C13.9997 4.88135 13.6496 5.7266 13.0277 6.35124L13.0283 6.35189L7.41894 12.0758L7.41374 12.0804C7.03876 12.4552 6.53051 12.6663 6.00033 12.6663C5.47002 12.6663 4.96131 12.4553 4.58626 12.0804H4.58561C4.21076 11.7054 4.00033 11.1966 4.00033 10.6663C4.00035 10.1382 4.20901 9.63142 4.58105 9.25684L10.1904 3.53288L10.2406 3.48665C10.5002 3.27047 10.8866 3.28218 11.1331 3.52376C11.3961 3.78147 11.4006 4.2035 11.1429 4.46647L5.53353 10.1904L5.52897 10.195C5.40401 10.32 5.33368 10.4896 5.33366 10.6663C5.33366 10.8431 5.40399 11.0127 5.52897 11.1377L5.5778 11.182C5.69639 11.279 5.84572 11.333 6.00033 11.333C6.17689 11.3329 6.3461 11.2625 6.47103 11.1377L12.0758 5.41829L12.0804 5.41374L12.2132 5.26725C12.5048 4.91136 12.6663 4.46379 12.6663 3.99967ZM13.5231 7.73405C13.7804 7.47072 14.2024 7.46576 14.4658 7.72298C14.7291 7.98024 14.7341 8.40231 14.4769 8.66569L13.5231 7.73405Z"
      fill="#444444"
    />
  </svg>
);

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
          'Start typing here or attached a file containing the form...',
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

  const previewSurvey = createPreviewSurvey(form);
  const screenCount = Math.max(...previewSurvey.components.map(component => component.screenIndex)) + 1;

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
        <PreviewHeaderSpacer aria-hidden="true" />
      </PreviewHeader>
      <PreviewHeader>
        <PreviewHeaderSpacer aria-hidden="true" />
        <PreviewFormTitle>{form.title}</PreviewFormTitle>
        <PreviewHeaderSpacer aria-hidden="true" />
      </PreviewHeader>
      <PreviewProgress $segments={screenCount} aria-hidden="true">
        {Array.from({ length: screenCount }, (_, index) => (
          <PreviewProgressSegment key={index} $active={index === 0} />
        ))}
      </PreviewProgress>
      <PreviewBody>
        <PreviewSurveyWrap>
          <Form
            initialValues={{}}
            onSubmit={async () => {}}
            render={({ values, setFieldValue, validateForm, setErrors, errors, setStatus, status }) => (
              <SurveyScreenPaginator
                survey={previewSurvey}
                values={values}
                setFieldValue={setFieldValue}
                onSurveyComplete={async () => {}}
                validateForm={validateForm}
                setErrors={setErrors}
                errors={errors}
                setStatus={setStatus}
                status={status}
                getComponentForQuestionType={getComponentForQuestionType}
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
