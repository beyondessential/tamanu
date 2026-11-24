export interface StringStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export interface StoredState<T> {
  /**
   * Starts reading ahead of whoever will ask for the result. The next `read` resolves to
   * what this finds, in place of going to storage again.
   */
  preload(): void;
  /** Resolves to what is stored, or null when nothing readable is */
  read(): Promise<Partial<T> | null>;
  write(state: T): Promise<void>;
}

const REDUX_PERSIST_KEY = '_persist';

// How long a read may take before the app carries on as though nothing were stored, so that
// storage which never answers cannot hold the first screen forever. redux-persist allowed
// the same.
const READ_TIMEOUT_MS = 5000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Parses a stored state entry.
 *
 * Builds that kept this state in Redux wrote it through redux-persist, which stores each
 * top-level value as a JSON string of its own beside a `_persist` entry. A device updating
 * from one of those builds still holds that format, so it is unwrapped here.
 */
export const parseStoredState = <T>(raw: string | null): Partial<T> | null => {
  if (!raw) return null;

  try {
    const stored: unknown = JSON.parse(raw);
    if (!isRecord(stored)) return null;
    if (!(REDUX_PERSIST_KEY in stored)) return stored as Partial<T>;

    const { [REDUX_PERSIST_KEY]: _persist, ...values } = stored;
    return Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, JSON.parse(value as string)]),
    ) as Partial<T>;
  } catch {
    return null;
  }
};

export const createStoredState = <T>(storage: StringStorage, key: string): StoredState<T> => {
  // Each write waits for the one before it, so changes made in quick succession reach
  // storage in the order they were made
  let lastWrite = Promise.resolve();
  let writesInFlight = 0;
  let preloaded: Promise<Partial<T> | null> | null = null;

  const readFromStorage = async (): Promise<Partial<T> | null> => {
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<null>(resolve => {
      timer = setTimeout(resolve, READ_TIMEOUT_MS, null);
    });
    // A write still in the queue holds the newest state, so the read waits behind it rather
    // than returning what storage held before it. With nothing in the queue it starts now,
    // so a read started ahead of time is under way at once.
    const stored = writesInFlight
      ? lastWrite.then(() => storage.getItem(key))
      : storage.getItem(key);
    try {
      return parseStoredState<T>(await Promise.race([stored, timeout]));
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  return {
    preload() {
      preloaded ??= readFromStorage();
    },

    read() {
      // A preloaded read is handed over once. Anything that reads again later, such as a
      // provider that has remounted, gets what is in storage by then.
      const stored = preloaded ?? readFromStorage();
      preloaded = null;
      return stored;
    },

    write(state) {
      writesInFlight += 1;
      lastWrite = lastWrite
        .then(() => storage.setItem(key, JSON.stringify(state)))
        .catch(() => console.warn(`Could not write ${key} to storage`))
        .finally(() => {
          writesInFlight -= 1;
        });
      return lastWrite;
    },
  };
};
