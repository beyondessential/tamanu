import { useState } from 'react';

/**
 * Calls the provided callback when the dependency changes, without triggering needless re-renders.
 * @see https://react.dev/learn/you-might-not-need-an-effect
 *
 * @param {unknown} watched The “dependency”, singular (not a dependency list!). `useReaction` uses
 * {@link Object.is} to detect changes to this value.
 * @param {() => void | undefined} listener The “effect”. Called when the watched value changes.
 * @returns {void}
 */
export default function useReaction(watched, listener) {
  const [prev, setPrev] = useState(watched);
  if (!Object.is(prev, watched)) {
    listener?.();
    setPrev(watched);
  }
}
