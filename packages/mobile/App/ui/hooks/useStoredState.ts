import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import type { StoredState } from '~/ui/helpers/storedState';

/**
 * State that survives the app closing. It starts as `initialState`, takes on what is in
 * storage once that has been read, and is stored on every change after that.
 *
 * `isRestored` is false until the read settles. Hold off rendering anything that depends on
 * the state until then, or it will briefly see `initialState` in place of what was stored.
 */
export const useStoredState = <T extends object>(
  storedState: StoredState<T>,
  initialState: T,
): [T, Dispatch<SetStateAction<T>>, boolean] => {
  const [state, setState] = useState(initialState);
  const [restoredState, setRestoredState] = useState<T | null>(null);

  useEffect(() => {
    let isCurrent = true;
    (async () => {
      const stored = await storedState.read();
      if (!isCurrent) return;
      const restored = { ...initialState, ...stored };
      setState(restored);
      setRestoredState(restored);
    })();
    return () => {
      isCurrent = false;
    };
  }, [storedState, initialState]);

  useEffect(() => {
    // The restored state is not stored again. It is either what storage already holds, or
    // what stands in for an entry that could not be read, and storing that would replace an
    // entry the next read might have managed.
    if (restoredState && state !== restoredState) storedState.write(state);
  }, [storedState, state, restoredState]);

  return [state, setState, restoredState !== null];
};
