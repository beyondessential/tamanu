import { createStoredState, parseStoredState, type StringStorage } from './storedState';

const session = {
  token: 'token-1',
  refreshToken: 'refresh-1',
  user: { id: 'user-1', displayName: 'Ana' },
  signedIn: true,
  isFirstTime: false,
};

describe('parseStoredState', () => {
  it('returns null when nothing is stored', () => {
    expect(parseStoredState(null)).toBeNull();
  });

  it('reads a plain JSON entry as it is', () => {
    expect(parseStoredState(JSON.stringify(session))).toEqual(session);
  });

  it('keeps null values', () => {
    const signedOut = { ...session, token: null, refreshToken: null, signedIn: false };

    expect(parseStoredState(JSON.stringify(signedOut))).toEqual(signedOut);
  });

  it('returns null for an entry that does not parse', () => {
    expect(parseStoredState('{"token":')).toBeNull();
  });

  it('returns null for an entry that is not an object', () => {
    expect(parseStoredState('"token-1"')).toBeNull();
    expect(parseStoredState('[1, 2]')).toBeNull();
  });
});

describe('createStoredState', () => {
  const createStorage = (): jest.Mocked<StringStorage> => ({
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
  });

  it('reads the entry stored under its key', async () => {
    const storage = createStorage();
    storage.getItem.mockResolvedValue(JSON.stringify(session));

    const stored = await createStoredState(storage, 'session').read();

    expect(storage.getItem).toHaveBeenCalledWith('session');
    expect(stored).toEqual(session);
  });

  it('reads nothing when storage cannot be read', async () => {
    const storage = createStorage();
    storage.getItem.mockRejectedValue(new Error('locked'));

    expect(await createStoredState(storage, 'session').read()).toBeNull();
  });

  it('reads what a write still in the queue is storing, not what was there before', async () => {
    const storage = createStorage();
    storage.getItem.mockResolvedValue(JSON.stringify({ signedIn: true }));
    let finishWriting: () => void;
    storage.setItem.mockReturnValue(
      new Promise<void>(resolve => {
        finishWriting = () => {
          storage.getItem.mockResolvedValue(JSON.stringify({ signedIn: false }));
          resolve();
        };
      }),
    );
    const storedState = createStoredState<{ signedIn: boolean }>(storage, 'session');

    storedState.write({ signedIn: false });
    const read = storedState.read();
    await Promise.resolve();
    expect(storage.getItem).not.toHaveBeenCalled();
    finishWriting();

    expect(await read).toEqual({ signedIn: false });
  });

  it('reads nothing when storage has not answered after five seconds', async () => {
    jest.useFakeTimers();
    const storage = createStorage();
    storage.getItem.mockReturnValue(new Promise(() => {}));

    const read = createStoredState(storage, 'session').read();
    jest.advanceTimersByTime(4999);
    const settled = jest.fn();
    read.then(settled);
    await Promise.resolve();
    expect(settled).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);

    expect(await read).toBeNull();
    jest.useRealTimers();
  });

  it('starts reading on preload and hands the result to the next read', async () => {
    const storage = createStorage();
    storage.getItem.mockResolvedValue(JSON.stringify(session));
    const storedState = createStoredState(storage, 'session');

    storedState.preload();
    storedState.preload();
    expect(storage.getItem).toHaveBeenCalledTimes(1);

    expect(await storedState.read()).toEqual(session);
    expect(storage.getItem).toHaveBeenCalledTimes(1);
  });

  it('goes back to storage for a read after the preloaded one', async () => {
    const storage = createStorage();
    storage.getItem.mockResolvedValue(JSON.stringify(session));
    const storedState = createStoredState(storage, 'session');
    storedState.preload();
    await storedState.read();
    storage.getItem.mockResolvedValue(JSON.stringify({ ...session, signedIn: false }));

    expect(await storedState.read()).toEqual({ ...session, signedIn: false });
  });

  it('writes plain JSON under its key', async () => {
    const storage = createStorage();

    await createStoredState(storage, 'session').write(session);

    expect(storage.setItem).toHaveBeenCalledWith('session', JSON.stringify(session));
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
    const storedState = createStoredState<{ signedIn: boolean }>(storage, 'session');

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
    const storedState = createStoredState<{ signedIn: boolean }>(storage, 'session');

    storedState.write({ signedIn: true });
    await storedState.write({ signedIn: false });

    expect(storage.setItem).toHaveBeenLastCalledWith('session', '{"signedIn":false}');
    warn.mockRestore();
  });
});
