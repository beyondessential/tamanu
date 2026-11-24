import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import type { StoredState } from '~/ui/helpers/storedState';

/**
 * State that survives the app closing. It starts as `initialState`, takes on what is in
 * storage once that has been read, and is written back on every change after that.
 *
 * `isRestored` is false until the read settles. Hold off rendering anything that depends on
 * the state until then, or it will briefly see `initialState` in place of what was stored.
 */
export const useStoredState = <T extends object>(
  storedState: StoredState<T>,
  initialState: T,
): [T, Dispatch<SetStateAction<T>>, boolean] => {
  const [state, setState] = useState(initialState);
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    (async () => {
      const stored = await storedState.read();
      if (!isCurrent) return;
      if (stored) setState(current => ({ ...current, ...stored }));
      setIsRestored(true);
    })();
    return () => {
      isCurrent = false;
    };
  }, [storedState]);

  useEffect(() => {
    if (isRestored) storedState.write(state);
  }, [storedState, state, isRestored]);

  return [state, setState, isRestored];
};
