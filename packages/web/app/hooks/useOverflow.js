import { useState, useRef, useLayoutEffect } from 'react';

/**
 * Reports whether an element is clipping its own content, for callers that offer the
 * full text some other way (a tooltip, typically) only when it cannot be read in place.
 *
 * The answer is re-measured whenever the element changes size, not taken once on
 * mount: text that fits at one window width is clipped at another, and an answer
 * measured on mount alone goes stale as soon as the window moves, leaving clipped
 * text with no way to read it.
 */
const useOverflow = () => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const ref = useRef(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const checkOverflow = () =>
      setIsOverflowing(
        element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight,
      );

    // Measured before paint, so the first render already knows; the observer then
    // reports every size the element takes after that.
    checkOverflow();

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, isOverflowing];
};

export default useOverflow;
