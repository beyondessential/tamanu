import { useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useOutletContext } from 'react-router';

import { WS_EVENTS } from '@tamanu/constants';
import { TranslatedText, useTranslation } from '@tamanu/ui-components';
import { useApi } from '../../../../../api';
import { notifyError, notifySuccess } from '../../../../../utils';
import { saveFile } from '../../../../../utils/fileSystemAccess';
import { useSocket } from '../../../../../utils/useSocket';
import {
  Attachment,
  AttachmentLabel,
  AssistantMessageContent,
  BuilderArticle,
  BuilderShell,
  ChatColumn,
  ChatComposer,
  ChatPanel,
  ChatStack,
  Disclaimer,
  DownloadMessage,
  IntroText,
  Messages,
  NewChatConfirmModal,
  PendingAttachmentRow,
  ProgramQuestionMessage,
  ThinkingMessage,
  UserMessageContent,
} from './ChatComponents';
import { FormPreview } from './FormPreview';
import { normaliseProgramDefinition } from './programDefinition';
import { createProgramDefinitionWorkbook } from './programDefinitionWorkbook';
import {
  ACCEPTED_FILE_EXTENSIONS,
  createEmptyState,
  createMessage,
  readSessionChatState,
  writeSessionChatState,
} from './chatState';
import { useProgramsQuery } from '../queries';

const getProgramCode = programId => programId?.replace(/^program-/, '');
const getProgramDefinitionFileName = programDefinition =>
  `${programDefinition?.surveys?.[0]?.name || programDefinition?.title || 'Generated form'}.xlsx`;
const getChatJobProgressEventName = jobId => `${WS_EVENTS.FORM_BUILDER_CHAT_PROGRESS}:${jobId}`;
const CHAT_JOB_MAX_WAIT_MS = 10 * 60 * 1000;
const LONG_WAIT_MESSAGE_DELAY_MS = 15000;

const THINKING_MESSAGES = {
  starting: {
    stringId: 'admin.programs.aiFormBuilder.thinking.starting',
    fallback: 'Starting the form builder...',
  },
  readingFile: {
    stringId: 'admin.programs.aiFormBuilder.thinking.readingFile',
    fallback: 'Reading the uploaded file...',
  },
  readingPdf: {
    stringId: 'admin.programs.aiFormBuilder.thinking.readingPdf',
    fallback: 'Reading the PDF...',
  },
  readingImage: {
    stringId: 'admin.programs.aiFormBuilder.thinking.readingImage',
    fallback: 'Reading the image...',
  },
  readingSpreadsheet: {
    stringId: 'admin.programs.aiFormBuilder.thinking.readingSpreadsheet',
    fallback: 'Reading the spreadsheet...',
  },
  reviewingForm: {
    stringId: 'admin.programs.aiFormBuilder.thinking.reviewingForm',
    fallback: 'Working out the next questions...',
  },
  applyingChanges: {
    stringId: 'admin.programs.aiFormBuilder.thinking.applyingChanges',
    fallback: 'Applying your changes...',
  },
  buildingPreview: {
    stringId: 'admin.programs.aiFormBuilder.thinking.buildingPreview',
    fallback: 'Building the form preview...',
  },
  uploadingFile: {
    stringId: 'admin.programs.aiFormBuilder.thinking.uploadingFile',
    fallback: 'Uploading the file...',
  },
  sendingMessage: {
    stringId: 'admin.programs.aiFormBuilder.thinking.sendingMessage',
    fallback: 'Sending your message...',
  },
};

const getThinkingMessage = (getTranslation, stage) => {
  const message = THINKING_MESSAGES[stage];
  if (!message) return null;
  return getTranslation(message.stringId, message.fallback);
};

const waitForChatJob = ({ socket, jobId, signal, onProgress }) => {
  if (!socket) {
    throw new Error('The form builder socket is not connected. Please try again.');
  }

  return new Promise((resolve, reject) => {
    const eventName = getChatJobProgressEventName(jobId);
    const cleanup = () => {
      clearTimeout(timeout);
      socket.off(eventName, handleJobUpdate);
      signal.removeEventListener('abort', handleAbort);
    };
    const handleAbort = () => {
      cleanup();
      reject(new DOMException('The request was aborted.', 'AbortError'));
    };
    const handleJobUpdate = job => {
      if (job.progressStage) onProgress?.(job.progressStage);
      if (job.status === 'complete') {
        cleanup();
        resolve(job.result);
      }
      if (job.status === 'failed') {
        cleanup();
        reject(new Error(job.error?.detail || job.error?.message || 'Unable to build the form'));
      }
    };
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('The form builder response took too long. Please try again.'));
    }, CHAT_JOB_MAX_WAIT_MS);

    signal.addEventListener('abort', handleAbort, { once: true });
    socket.on(eventName, handleJobUpdate);
  });
};

export function AiFormBuilderView() {
  const { newChatRequestId, setHasAiFormBuilderChat } = useOutletContext();
  const { getTranslation } = useTranslation();
  const api = useApi();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const sessionKey = useSelector(state => state.auth.token);
  const [state, setState] = useState(() => readSessionChatState(sessionKey));
  const [inputValue, setInputValue] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isTakingAWhile, setIsTakingAWhile] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(() =>
    Boolean(readSessionChatState(sessionKey).generatedForm),
  );
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const abortControllerRef = useRef(null);
  const messagesRef = useRef(null);
  const previousNewChatRequestIdRef = useRef(newChatRequestId);

  const { data: programOptions = [] } = useProgramsQuery({
    select: programs =>
      programs.map(program => ({
        label: program.name,
        value: program.id,
        code: getProgramCode(program.id),
      })),
  });

  const hasExistingChat = Boolean(
    state.messages.length || state.generatedForm || inputValue.trim() || pendingFile,
  );
  const generatedForm = normaliseProgramDefinition(state.generatedForm);
  const showPreview = Boolean(generatedForm && isPreviewOpen);
  const sendDisabled = !inputValue.trim() && !pendingFile;

  useEffect(() => {
    const nextState = readSessionChatState(sessionKey);
    setState(nextState);
    setIsPreviewOpen(Boolean(nextState.generatedForm));
  }, [sessionKey]);

  useEffect(() => {
    writeSessionChatState(sessionKey, state);
  }, [sessionKey, state]);

  useEffect(() => {
    const messagesEl = messagesRef.current;
    if (!messagesEl) return;
    messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' });
  }, [state.messages.length, isThinking, isTakingAWhile, thinkingMessage]);

  useEffect(() => {
    if (!isThinking) {
      setIsTakingAWhile(false);
      setThinkingMessage(null);
      return undefined;
    }

    const timeout = setTimeout(() => setIsTakingAWhile(true), LONG_WAIT_MESSAGE_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [isThinking]);

  useEffect(() => {
    setHasAiFormBuilderChat(hasExistingChat);
  }, [hasExistingChat, setHasAiFormBuilderChat]);

  useEffect(() => {
    return () => setHasAiFormBuilderChat(false);
  }, [setHasAiFormBuilderChat]);

  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  const resetChat = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setState(createEmptyState());
    setInputValue('');
    setPendingFile(null);
    setIsThinking(false);
    setIsTakingAWhile(false);
    setThinkingMessage(null);
    setIsPreviewOpen(false);
    setIsNewChatModalOpen(false);
  }, []);

  useEffect(() => {
    if (previousNewChatRequestIdRef.current === newChatRequestId) return;
    previousNewChatRequestIdRef.current = newChatRequestId;
    if (hasExistingChat) {
      setIsNewChatModalOpen(true);
      return;
    }
    resetChat();
  }, [hasExistingChat, newChatRequestId, resetChat]);

  const appendMessage = useCallback(message => {
    setState(current => ({
      ...current,
      messages: [...current.messages, createMessage(message)],
    }));
  }, []);

  const sendChatMessage = useCallback(
    async ({ message, file, selectedProgramId }) => {
      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      setIsThinking(true);
      setIsTakingAWhile(false);
      setThinkingMessage(
        getThinkingMessage(getTranslation, file ? 'uploadingFile' : 'sendingMessage'),
      );

      try {
        const selectedProgramCode = getProgramCode(selectedProgramId);
        const body = {
          async: true,
          sessionId: state.sessionId,
          programDefinition: state.generatedForm
            ? normaliseProgramDefinition(state.generatedForm)
            : undefined,
          message: [
            selectedProgramCode ? `[PROGRAM SELECTED] ${selectedProgramCode}` : null,
            message,
          ]
            .filter(Boolean)
            .join('\n\n'),
        };
        const response = file
          ? await api.postWithFileUpload('admin/form-builder/chat', file, body, {
              signal: abortController.signal,
            })
          : await api.post('admin/form-builder/chat', body, { signal: abortController.signal });
        const chatResponse = response.jobId
          ? await waitForChatJob({
              socket,
              jobId: response.jobId,
              signal: abortController.signal,
              onProgress: progressStage =>
                setThinkingMessage(getThinkingMessage(getTranslation, progressStage)),
            })
          : response;

        if (chatResponse.programDefinition) {
          setIsPreviewOpen(true);
        }

        setState(current => {
          const generatedFormIteration = chatResponse.programDefinition
            ? (current.generatedFormIteration ?? 0) + 1
            : current.generatedFormIteration;

          return {
            ...current,
            sessionId: chatResponse.sessionId,
            readyToExport: Boolean(chatResponse.readyToExport),
            readyToGenerate: Boolean(chatResponse.readyToGenerate),
            generatedForm: chatResponse.programDefinition
              ? normaliseProgramDefinition(chatResponse.programDefinition)
              : current.generatedForm,
            generatedFormIteration,
            savedSurveyId: chatResponse.programDefinition ? null : current.savedSurveyId,
            messages: [
              ...current.messages,
              createMessage({
                type: 'assistant',
                text: chatResponse.message,
              }),
              ...(chatResponse.programDefinition
                ? [
                    createMessage({
                      type: 'download',
                      fileName: getProgramDefinitionFileName(chatResponse.programDefinition),
                      iteration: generatedFormIteration,
                    }),
                  ]
                : []),
            ],
          };
        });
      } catch (error) {
        if (!abortController.signal.aborted && error.name !== 'AbortError') {
          const errorMessage =
            error.detail ||
            error.message ||
            getTranslation(
              'admin.programs.aiFormBuilder.error.generate.unknown',
              'Please try again.',
            );

          appendMessage({
            type: 'assistant',
            text: getTranslation(
              'admin.programs.aiFormBuilder.error.generate.chatMessage',
              'Sorry, I could not get a response from the form builder: :message',
              { replacements: { message: errorMessage } },
            ),
          });
          notifyError(
            <TranslatedText
              stringId="admin.programs.aiFormBuilder.error.generate"
              fallback="Unable to build the form"
            />,
          );
        }
      } finally {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
          setIsThinking(false);
        }
      }
    },
    [api, appendMessage, getTranslation, socket, state.generatedForm, state.sessionId],
  );

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsThinking(false);
    setIsTakingAWhile(false);
    setThinkingMessage(null);
    appendMessage({
      type: 'assistant',
      text: getTranslation(
        'admin.programs.aiFormBuilder.stoppedMessage',
        'The response was stopped. What would you like me to do?',
      ),
    });
  }, [appendMessage, getTranslation]);

  const handleSelectProgram = useCallback(
    programId => {
      const pendingSubmission = state.pendingSubmission;
      setState(current => ({ ...current, selectedProgramId: programId, pendingSubmission: null }));
      if (programId && pendingSubmission && !isThinking) {
        sendChatMessage({ ...pendingSubmission, selectedProgramId: programId });
      }
    },
    [isThinking, sendChatMessage, state.pendingSubmission],
  );

  const handleSubmit = useCallback(() => {
    if (isThinking) return;

    const text = inputValue.trim();
    if (!text && !pendingFile) return;

    const userMessage = createMessage({
      type: 'user',
      text,
      file: pendingFile ? { name: pendingFile.name } : null,
    });

    const submission = { message: text, file: pendingFile };

    setState(current => ({
      ...current,
      pendingSubmission: current.selectedProgramId ? null : submission,
      messages: [
        ...current.messages,
        userMessage,
        ...(current.selectedProgramId ? [] : [createMessage({ type: 'programQuestion' })]),
      ],
    }));

    setInputValue('');
    setPendingFile(null);

    if (!state.selectedProgramId) {
      return;
    }

    sendChatMessage({ ...submission, selectedProgramId: state.selectedProgramId });
  }, [inputValue, isThinking, pendingFile, sendChatMessage, state.selectedProgramId]);

  const setFileIfValid = file => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !ACCEPTED_FILE_EXTENSIONS.includes(extension)) {
      notifyError(
        <TranslatedText
          stringId="admin.programs.aiFormBuilder.fileType.error"
          fallback="Attach a png, pdf, jpg, jpeg, csv, xls or xlsx file."
        />,
      );
      return false;
    }

    setPendingFile(file);
    return true;
  };

  const handleFileSelected = event => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileIfValid(file);
    event.target.value = '';
  };

  const handleDrop = event => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) setFileIfValid(file);
  };

  const handleDownload = async fileName => {
    if (!generatedForm) return;

    await saveFile({
      defaultFileName: fileName,
      extension: 'xlsx',
      getData: async () => createProgramDefinitionWorkbook(generatedForm),
    });
  };

  const handleSave = async () => {
    if (isSaving || state.savedSurveyId || !generatedForm || !state.selectedProgramId) return;

    setIsSaving(true);
    try {
      const { surveys } = await api.post(
        `admin/program/${encodeURIComponent(state.selectedProgramId)}/ai-form-builder-survey`,
        {
          form: generatedForm,
        },
      );
      setState(current => ({
        ...current,
        savedSurveyId: surveys[0]?.id,
        messages: [
          ...current.messages,
          createMessage({
            type: 'assistant',
            text: getTranslation(
              'admin.programs.aiFormBuilder.save.successMessage',
              'Survey has been saved to the database',
            ),
          }),
        ],
      }));
      await queryClient.invalidateQueries({ queryKey: ['programs'] });

      notifySuccess(
        <TranslatedText
          stringId="admin.programs.aiFormBuilder.save.success"
          fallback="Survey has been saved to the database"
        />,
      );
    } catch (error) {
      notifyError(
        <TranslatedText
          stringId="admin.programs.aiFormBuilder.save.error"
          fallback="Unable to save the form: :message"
          replacements={{
            message:
              error.detail ||
              error.message ||
              getTranslation(
                'admin.programs.aiFormBuilder.save.error.unknown',
                'Failed to persist to database',
              ),
          }}
        />,
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BuilderArticle>
      <BuilderShell $showPreview={showPreview}>
        <ChatColumn>
          <ChatStack $showPreview={showPreview}>
            <ChatPanel>
              <Messages ref={messagesRef}>
                <IntroText>
                  <TranslatedText
                    stringId="admin.programs.aiFormBuilder.welcome"
                    fallback="Welcome to the Tamanu form builder. Let's start by uploading a document containing the form otherwise describe the form you'd like to build and I'll help you build it."
                  />
                </IntroText>

                {state.messages.map(message => {
                  if (message.type === 'user') {
                    return <UserMessageContent key={message.id} message={message} />;
                  }
                  if (message.type === 'programQuestion') {
                    return (
                      <ProgramQuestionMessage
                        key={message.id}
                        value={state.selectedProgramId}
                        onChange={handleSelectProgram}
                        programOptions={programOptions}
                        disabled={Boolean(state.selectedProgramId)}
                      />
                    );
                  }
                  if (message.type === 'download') {
                    return (
                      <DownloadMessage
                        key={message.id}
                        fileName={message.fileName}
                        isSaved={Boolean(state.savedSurveyId)}
                        iteration={message.iteration}
                        onDownload={() => handleDownload(message.fileName)}
                        isSaving={isSaving}
                        onSave={handleSave}
                        onPreview={() => setIsPreviewOpen(true)}
                      />
                    );
                  }
                  return <AssistantMessageContent key={message.id} text={message.text} />;
                })}

                {isThinking && (
                  <ThinkingMessage isTakingAWhile={isTakingAWhile} message={thinkingMessage} />
                )}
              </Messages>

              {pendingFile && (
                <PendingAttachmentRow>
                  <AttachmentLabel>
                    <TranslatedText
                      stringId="admin.programs.aiFormBuilder.pendingAttachment.label"
                      fallback="Attachment:"
                    />
                  </AttachmentLabel>
                  <Attachment file={pendingFile} fullWidth onRemove={() => setPendingFile(null)} />
                </PendingAttachmentRow>
              )}

              <ChatComposer
                acceptedFileExtensions={ACCEPTED_FILE_EXTENSIONS}
                getTranslation={getTranslation}
                handleDrop={handleDrop}
                handleFileSelected={handleFileSelected}
                handleStop={handleStop}
                handleSubmit={handleSubmit}
                inputValue={inputValue}
                isThinking={isThinking}
                sendDisabled={sendDisabled}
                setInputValue={setInputValue}
              />
            </ChatPanel>
            <Disclaimer>
              <TranslatedText
                stringId="admin.programs.aiFormBuilder.disclaimer"
                fallback="You are using AI which can make mistakes. Please double check all responses and output."
              />
            </Disclaimer>
          </ChatStack>
        </ChatColumn>
        {showPreview && (
          <FormPreview
            form={generatedForm}
            isSaved={Boolean(state.savedSurveyId)}
          />
        )}
      </BuilderShell>
      <NewChatConfirmModal
        open={isNewChatModalOpen}
        onCancel={() => setIsNewChatModalOpen(false)}
        onConfirm={resetChat}
      />
    </BuilderArticle>
  );
}
