import { useEffect, useRef } from 'react';

// a custom hook that will run the effect only after the first render
export function useDidUpdateEffect(fn, inputs) {
  // Use useRef over useState as useState would result in unnecessary component update
  const isMountingRef = useRef(false);

  useEffect(() => {
    isMountingRef.current = true;
  }, []);

  useEffect(() => {
    if (!isMountingRef.current) {
      return fn();
    } else {
      isMountingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, inputs);
}
