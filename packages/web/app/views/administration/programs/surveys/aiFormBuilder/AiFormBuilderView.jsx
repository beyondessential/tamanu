import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useOutletContext } from 'react-router';

import { TranslatedText, useTranslation } from '@tamanu/ui-components';
import { notifyError, notifySuccess } from '../../../../../utils';
import { saveFile } from '../../../../../utils/fileSystemAccess';
import {
  Attachment,
  AttachmentLabel,
  BuilderArticle,
  BuilderShell,
  ChatColumn,
  ChatComposer,
  ChatPanel,
  ChatStack,
  Disclaimer,
  DownloadMessage,
  IntroText,
  MessageText,
  Messages,
  NewChatConfirmModal,
  PendingAttachmentRow,
  ProgramQuestionMessage,
  ThinkingMessage,
  UserMessageContent,
} from './ChatComponents';
import { FormPreview } from './FormPreview';
import { mockGenerateForm } from './mockGenerateForm';
import {
  ACCEPTED_FILE_EXTENSIONS,
  createEmptyState,
  createMessage,
  readSessionChatState,
  writeSessionChatState,
} from './chatState';
import { useProgramsQuery } from '../queries';

export function AiFormBuilderView() {
  const { newChatRequestId, setHasAiFormBuilderChat } = useOutletContext();
  const { getTranslation } = useTranslation();
  const sessionKey = useSelector(state => state.auth.token);
  const [state, setState] = useState(() => readSessionChatState(sessionKey));
  const [inputValue, setInputValue] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const abortControllerRef = useRef(null);
  const inputFileRef = useRef(null);
  const messagesRef = useRef(null);
  const previousNewChatRequestIdRef = useRef(newChatRequestId);

  const { data: programOptions = [] } = useProgramsQuery({
    select: programs => programs.map(program => ({ label: program.name, value: program.id })),
  });

  const hasExistingChat = Boolean(
    state.messages.length || state.generatedForm || inputValue.trim() || pendingFile,
  );
  const showPreview = Boolean(state.generatedForm);
  const sendDisabled = !inputValue.trim() && !pendingFile;

  useEffect(() => {
    setState(readSessionChatState(sessionKey));
  }, [sessionKey]);

  useEffect(() => {
    writeSessionChatState(sessionKey, state);
  }, [sessionKey, state]);

  useEffect(() => {
    const messagesEl = messagesRef.current;
    if (!messagesEl) return;
    messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' });
  }, [state.messages.length, isThinking]);

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

  const runMockGeneration = useCallback(async ({ title } = {}) => {
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsThinking(true);

    try {
      const generatedForm = await mockGenerateForm({ signal: abortController.signal, title });
      setState(current => ({
        ...current,
        generatedForm,
        messages: [
          ...current.messages,
          createMessage({
            type: 'download',
            fileName: generatedForm.downloadFileName,
          }),
        ],
      }));
    } catch (error) {
      if (error.name !== 'AbortError') {
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
  }, []);

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsThinking(false);
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
      const shouldGenerate = Boolean(programId) && !state.generatedForm;
      setState(current => ({ ...current, selectedProgramId: programId }));
      if (shouldGenerate && !isThinking) runMockGeneration();
    },
    [isThinking, runMockGeneration, state.generatedForm],
  );

  const handleSubmit = useCallback(() => {
    if (isThinking) return;

    const text = inputValue.trim();
    if (!text && !pendingFile) return;

    appendMessage({
      type: 'user',
      text,
      file: pendingFile ? { name: pendingFile.name } : null,
    });
    setInputValue('');
    setPendingFile(null);

    if (!state.selectedProgramId) {
      appendMessage({ type: 'programQuestion' });
      return;
    }

    runMockGeneration({ title: state.generatedForm?.title });
  }, [
    appendMessage,
    inputValue,
    isThinking,
    pendingFile,
    runMockGeneration,
    state.generatedForm?.title,
    state.selectedProgramId,
  ]);

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
    await saveFile({
      defaultFileName: fileName,
      extension: 'xlsx',
      getData: async () => 'Mock form builder export. AI generation is not connected yet.',
    });
  };

  const handleSave = () => {
    notifySuccess(
      <TranslatedText
        stringId="admin.programs.aiFormBuilder.save.success"
        fallback="Mock form saved to the database"
      />,
    );
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
                      />
                    );
                  }
                  if (message.type === 'download') {
                    return (
                      <DownloadMessage
                        key={message.id}
                        fileName={message.fileName}
                        onDownload={() => handleDownload(message.fileName)}
                        onSave={handleSave}
                      />
                    );
                  }
                  return <MessageText key={message.id}>{message.text}</MessageText>;
                })}

                {isThinking && <ThinkingMessage />}
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
                inputFileRef={inputFileRef}
                inputValue={inputValue}
                isThinking={isThinking}
                openFileDialog={() => inputFileRef.current?.click()}
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
        {showPreview && <FormPreview form={state.generatedForm} />}
      </BuilderShell>
      <NewChatConfirmModal
        open={isNewChatModalOpen}
        onCancel={() => setIsNewChatModalOpen(false)}
        onConfirm={resetChat}
      />
    </BuilderArticle>
  );
}
