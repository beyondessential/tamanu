export const ACCEPTED_FILE_EXTENSIONS = ['png', 'pdf', 'jpg', 'jpeg', 'csv', 'xls', 'xlsx'];

let messageIdCounter = 0;
let chatSessionKey = null;
let chatSessionState = null;

export const createMessage = message => ({
  id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${messageIdCounter++}`,
  ...message,
});

export const createEmptyState = () => ({
  messages: [],
  selectedProgramId: '',
  sessionId: null,
  pendingSubmission: null,
  queuedSubmissions: [],
  generatedForm: null,
  savedSurveyId: null,
});

export const readSessionChatState = sessionKey => {
  if (chatSessionKey !== sessionKey) {
    chatSessionKey = sessionKey;
    chatSessionState = createEmptyState();
  }
  return chatSessionState;
};

export const writeSessionChatState = (sessionKey, state) => {
  chatSessionKey = sessionKey;
  chatSessionState = state;
};
