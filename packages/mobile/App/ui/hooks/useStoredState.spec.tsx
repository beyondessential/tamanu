import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { StoredState } from '~/ui/helpers/storedState';
import { useStoredState } from './useStoredState';

jest.useRealTimers();

interface Session {
  signedIn: boolean;
}

const createStoredState = (stored?: Partial<Session>): jest.Mocked<StoredState<Session>> => ({
  preload: jest.fn(),
  read: jest.fn().mockResolvedValue(stored ?? null),
  write: jest.fn().mockResolvedValue(undefined),
});

describe('useStoredState', () => {
  it('reads storage once, however the initial state is passed', async () => {
    const storedState = createStoredState({ signedIn: true });

    // A fresh object each render, as a caller writing the initial state inline would pass
    const { result, rerender } = await renderHook(() =>
      useStoredState(storedState, { signedIn: false }),
    );
    await waitFor(() => expect(result.current[2]).toBe(true));
    await act(async () => rerender({}));

    expect(storedState.read).toHaveBeenCalledTimes(1);
    expect(storedState.write).not.toHaveBeenCalled();
    expect(result.current[0]).toEqual({ signedIn: true });
  });

  it('stores every change once the stored state has been read', async () => {
    const storedState = createStoredState();

    const { result } = await renderHook(() => useStoredState(storedState, { signedIn: false }));
    await waitFor(() => expect(result.current[2]).toBe(true));
    await act(async () => result.current[1]({ signedIn: true }));

    expect(storedState.write).toHaveBeenCalledWith({ signedIn: true });
  });
});
