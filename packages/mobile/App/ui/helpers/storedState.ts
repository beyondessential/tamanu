export interface StringStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export interface StoredState<T> {
  /** Resolves to what is stored, or null when nothing readable is */
  read(): Promise<Partial<T> | null>;
  write(state: T): Promise<void>;
}

const REDUX_PERSIST_KEY = '_persist';

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

  return {
    async read() {
      try {
        return parseStoredState<T>(await storage.getItem(key));
      } catch {
        return null;
      }
    },

    write(state) {
      lastWrite = lastWrite
        .then(() => storage.setItem(key, JSON.stringify(state)))
        .catch(() => console.warn(`Could not write ${key} to storage`));
      return lastWrite;
    },
  };
};
