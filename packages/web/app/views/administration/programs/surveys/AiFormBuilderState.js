export const ACCEPTED_FILE_EXTENSIONS = ['png', 'pdf', 'jpg', 'jpeg', 'csv', 'xls', 'xlsx'];

const STORAGE_KEY = 'tamanu.aiFormBuilder.chat';

export const createMessage = message => ({
  id: `${Date.now()}-${Math.random()}`,
  ...message,
});

export const createEmptyState = () => ({
  messages: [],
  selectedProgramId: '',
  generatedForm: null,
});

export const readStoredState = () => {
  if (typeof window === 'undefined') return createEmptyState();

  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    return stored ? { ...createEmptyState(), ...JSON.parse(stored) } : createEmptyState();
  } catch {
    return createEmptyState();
  }
};

export const writeStoredState = state => {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable or out of quota; persistence is best-effort.
  }
};
