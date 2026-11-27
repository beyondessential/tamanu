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

// How long a read may take before the app carries on as though nothing were stored, so that
// storage which never answers cannot hold the first screen forever
const READ_TIMEOUT_MS = 5000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Parses a stored state entry, or returns null when it is missing or not an object */
export const parseStoredState = <T>(raw: string | null): Partial<T> | null => {
  if (!raw) return null;

  try {
    const stored: unknown = JSON.parse(raw);
    return isRecord(stored) ? (stored as Partial<T>) : null;
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
