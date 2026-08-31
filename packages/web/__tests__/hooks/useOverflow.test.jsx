import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import useOverflow from '../../app/hooks/useOverflow';

/**
 * jsdom lays nothing out, so every element measures as zero-sized and the overflow
 * answer itself cannot be exercised here. What can be pinned is which element the hook
 * is watching, which is where it went wrong: the observer stayed on the element it
 * first saw even after the caller replaced it.
 */
let observed;
let liveObservers;
let watchedForContent;

class SpyResizeObserver {
  constructor() {
    liveObservers.add(this);
  }

  observe(element) {
    observed.push(element);
  }

  unobserve() {}

  disconnect() {
    liveObservers.delete(this);
  }
}

class SpyMutationObserver {
  constructor() {
    liveObservers.add(this);
  }

  observe(element, options) {
    watchedForContent.push({ element, options });
  }

  disconnect() {
    liveObservers.delete(this);
  }
}

/** One watches the element's box, the other the text inside it. */
const WATCHERS_PER_ELEMENT = 2;

const originalResizeObserver = globalThis.ResizeObserver;
const originalMutationObserver = globalThis.MutationObserver;

beforeEach(() => {
  observed = [];
  liveObservers = new Set();
  watchedForContent = [];
  globalThis.ResizeObserver = SpyResizeObserver;
  globalThis.MutationObserver = SpyMutationObserver;
});

afterEach(() => {
  globalThis.ResizeObserver = originalResizeObserver;
  globalThis.MutationObserver = originalMutationObserver;
});

/**
 * Stands in for `ConditionalTooltip`, which renders its child bare until it has
 * something to reveal and wrapped afterwards. The wrapper changes the shape of the
 * tree, so the measured element is replaced rather than moved.
 */
const Probe = ({ wrapped }) => {
  const [ref] = useOverflow();
  const target = (
    <span ref={ref} data-testid="target">
      Outpatient Outpatient
    </span>
  );
  return wrapped ? <div>{target}</div> : target;
};

describe('useOverflow', () => {
  it('watches the element it is given', () => {
    render(<Probe wrapped={false} />);
    expect(observed).toEqual([screen.getByTestId('target')]);
  });

  it('follows the element to its replacement when the caller swaps it', () => {
    const { rerender } = render(<Probe wrapped={false} />);
    const before = screen.getByTestId('target');

    rerender(<Probe wrapped />);
    const after = screen.getByTestId('target');

    expect(after).not.toBe(before);
    expect(observed).toEqual([before, after]);
    // The pair watching the old element is let go, so only the replacement is watched.
    expect(liveObservers.size).toBe(WATCHERS_PER_ELEMENT);
  });

  /**
   * Text that grows without its box moving is still clipped, and a row re-rendering
   * with a longer name does exactly that. Watching only for resizes missed it, leaving
   * the reader on an ellipsis the code believed wasn't there.
   */
  it('watches the text as well as the box', () => {
    render(<Probe wrapped={false} />);
    const element = screen.getByTestId('target');

    expect(watchedForContent).toHaveLength(1);
    expect(watchedForContent[0].element).toBe(element);
    expect(watchedForContent[0].options).toMatchObject({
      subtree: true,
      childList: true,
      characterData: true,
    });
  });

  it('lets go of the element when the caller unmounts', () => {
    const { unmount } = render(<Probe wrapped={false} />);
    expect(liveObservers.size).toBe(WATCHERS_PER_ELEMENT);

    unmount();
    expect(liveObservers.size).toBe(0);
  });
});
