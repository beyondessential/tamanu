import { createStoredState, parseStoredState, type StringStorage } from './storedState';

const session = {
  token: 'token-1',
  refreshToken: 'refresh-1',
  user: { id: 'user-1', displayName: 'Ana' },
  signedIn: true,
  isFirstTime: false,
};

/** The shape redux-persist wrote: each value a JSON string of its own, plus `_persist` */
const asReduxPersistEntry = (state: Record<string, unknown>): string =>
  JSON.stringify({
    ...Object.fromEntries(
      Object.entries(state).map(([key, value]) => [key, JSON.stringify(value)]),
    ),
    _persist: JSON.stringify({ version: -1, rehydrated: true }),
  });

describe('parseStoredState', () => {
  it('returns null when nothing is stored', () => {
    expect(parseStoredState(null)).toBeNull();
  });

  it('reads a plain JSON entry as it is', () => {
    expect(parseStoredState(JSON.stringify(session))).toEqual(session);
  });

  it('unwraps an entry written by redux-persist', () => {
    expect(parseStoredState(asReduxPersistEntry(session))).toEqual(session);
  });

  it('unwraps nested state written by redux-persist', () => {
    const rootState = { patient: { selectedPatient: { id: 'patient-1', firstName: 'Mele' } } };

    expect(parseStoredState(asReduxPersistEntry(rootState))).toEqual(rootState);
  });

  it('keeps null values from a redux-persist entry', () => {
    const signedOut = { ...session, token: null, refreshToken: null, signedIn: false };

    expect(parseStoredState(asReduxPersistEntry(signedOut))).toEqual(signedOut);
  });

  it('returns null for an entry that does not parse', () => {
    expect(parseStoredState('{"token":')).toBeNull();
  });

  it('returns null for an entry that is not an object', () => {
    expect(parseStoredState('"token-1"')).toBeNull();
    expect(parseStoredState('[1, 2]')).toBeNull();
  });

  it('returns null for a redux-persist entry holding a value that does not parse', () => {
    const entry = JSON.stringify({ token: 'not json', _persist: '{"version":-1}' });

    expect(parseStoredState(entry)).toBeNull();
  });
});

describe('createStoredState', () => {
  const createStorage = (): jest.Mocked<StringStorage> => ({
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
  });

  it('reads the entry stored under its key', async () => {
    const storage = createStorage();
    storage.getItem.mockResolvedValue(asReduxPersistEntry(session));

    const stored = await createStoredState(storage, 'persist:auth').read();

    expect(storage.getItem).toHaveBeenCalledWith('persist:auth');
    expect(stored).toEqual(session);
  });

  it('reads nothing when storage cannot be read', async () => {
    const storage = createStorage();
    storage.getItem.mockRejectedValue(new Error('locked'));

    expect(await createStoredState(storage, 'persist:auth').read()).toBeNull();
  });

  it('starts reading on preload and hands the result to the next read', async () => {
    const storage = createStorage();
    storage.getItem.mockResolvedValue(JSON.stringify(session));
    const storedState = createStoredState(storage, 'persist:auth');

    storedState.preload();
    storedState.preload();
    expect(storage.getItem).toHaveBeenCalledTimes(1);

    expect(await storedState.read()).toEqual(session);
    expect(storage.getItem).toHaveBeenCalledTimes(1);
  });

  it('goes back to storage for a read after the preloaded one', async () => {
    const storage = createStorage();
    storage.getItem.mockResolvedValue(JSON.stringify(session));
    const storedState = createStoredState(storage, 'persist:auth');
    storedState.preload();
    await storedState.read();
    storage.getItem.mockResolvedValue(JSON.stringify({ ...session, signedIn: false }));

    expect(await storedState.read()).toEqual({ ...session, signedIn: false });
  });

  it('writes plain JSON under its key', async () => {
    const storage = createStorage();

    await createStoredState(storage, 'persist:auth').write(session);

    expect(storage.setItem).toHaveBeenCalledWith('persist:auth', JSON.stringify(session));
  });

  it('writes in the order the changes were made', async () => {
    const storage = createStorage();
    const written: string[] = [];
    let finishFirstWrite: () => void;
    storage.setItem.mockImplementationOnce(
      (_key, value) =>
        new Promise<void>(resolve => {
          finishFirstWrite = () => {
            written.push(value);
            resolve();
          };
        }),
    );
    storage.setItem.mockImplementation(async (_key, value) => {
      written.push(value);
    });
    const storedState = createStoredState<{ signedIn: boolean }>(storage, 'persist:auth');

    storedState.write({ signedIn: true });
    const lastWrite = storedState.write({ signedIn: false });
    await Promise.resolve();
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    finishFirstWrite();
    await lastWrite;

    expect(written).toEqual(['{"signedIn":true}', '{"signedIn":false}']);
  });

  it('carries on writing after a write fails', async () => {
    const storage = createStorage();
    storage.setItem.mockRejectedValueOnce(new Error('full'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const storedState = createStoredState<{ signedIn: boolean }>(storage, 'persist:auth');

    storedState.write({ signedIn: true });
    await storedState.write({ signedIn: false });

    expect(storage.setItem).toHaveBeenLastCalledWith('persist:auth', '{"signedIn":false}');
    warn.mockRestore();
  });
});
