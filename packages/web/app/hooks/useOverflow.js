import { useState, useRef, useCallback } from 'react';

/**
 * Reports whether an element is clipping its own content, for callers that offer the
 * full text some other way (a tooltip, typically) only when it cannot be read in place.
 *
 * The answer is re-measured whenever the element changes size, not taken once on
 * mount: text that fits at one window width is clipped at another, and an answer
 * measured on mount alone goes stale as soon as the window moves, leaving clipped
 * text with no way to read it.
 *
 * The element is tracked by a callback ref rather than an object one because callers
 * replace it. Revealing the overflow is what swaps it: `ConditionalTooltip` renders
 * its child bare while hidden and wrapped once shown, so the moment this reports
 * overflow the measured element is torn down and a new one put in its place. Bound to
 * the element it first saw, the observer would be left watching a detached node and
 * the answer would latch at "overflowing" however wide the window then got.
 */
const useOverflow = () => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const observer = useRef(null);

  // React calls this with null and then the new element on every swap, so each one is
  // measured as it arrives. Re-measuring cannot oscillate between the bare and wrapped
  // elements: React drops a state update that matches the current value, so the pair
  // settles as soon as both measure alike, which they do when the wrapper is the plain
  // block element it is here.
  const ref = useCallback(element => {
    observer.current?.disconnect();

    if (!element) {
      observer.current = null;
      return;
    }

    const checkOverflow = () =>
      setIsOverflowing(
        element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight,
      );

    checkOverflow();
    observer.current = new ResizeObserver(checkOverflow);
    observer.current.observe(element);
  }, []);

  return [ref, isOverflowing];
};

export default useOverflow;
