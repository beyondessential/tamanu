import { useState, useRef, useCallback } from 'react';

/**
 * Reports whether an element is clipping its own content, for callers that offer the
 * full text some other way (a tooltip, typically) only when it cannot be read in place.
 *
 * Text is clipped when it is wider than the space it is given, so the answer goes stale
 * when *either* side of that changes, and both change after first paint:
 *
 * - the space, when the window is resized, which a resize observer reports;
 * - the text, when the webfont arrives and the same characters are laid out at their
 *   real widths, or when the row re-renders with a longer name. Neither moves the
 *   element's own box, so a resize observer sees nothing and never fires.
 *
 * Watching only the box is what left clipped text with no way to read it: the element
 * keeps its width while the text outgrows it, so the reader is looking at an ellipsis
 * the code believes isn't there.
 *
 * The element is tracked by a callback ref rather than an object one because callers
 * replace it. Revealing the overflow is what swaps it: `ConditionalTooltip` renders its
 * child bare while hidden and wrapped once shown, so the moment this reports overflow
 * the measured element is torn down and a new one put in its place. Bound to the element
 * it first saw, the observers would be left watching a detached node.
 */
const useOverflow = () => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const stopWatching = useRef(null);

  const ref = useCallback(element => {
    stopWatching.current?.();
    stopWatching.current = null;

    if (!element) return;

    const checkOverflow = () =>
      setIsOverflowing(
        element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight,
      );

    checkOverflow();

    // The space the text is given.
    const resize = new ResizeObserver(checkOverflow);
    resize.observe(element);

    // The text itself, when the row re-renders with different content.
    const mutation = new MutationObserver(checkOverflow);
    mutation.observe(element, { subtree: true, childList: true, characterData: true });

    // The text again, when the webfont replaces the fallback it was first laid out in.
    // Guarded because the font API is one of the things jsdom does not implement.
    let watching = true;
    document.fonts?.ready.then(() => {
      if (watching) checkOverflow();
    });

    stopWatching.current = () => {
      watching = false;
      resize.disconnect();
      mutation.disconnect();
    };
  }, []);

  return [ref, isOverflowing];
};

export default useOverflow;
