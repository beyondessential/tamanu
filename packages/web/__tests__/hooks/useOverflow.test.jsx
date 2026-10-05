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

const originalResizeObserver = globalThis.ResizeObserver;

beforeEach(() => {
  observed = [];
  liveObservers = new Set();
  globalThis.ResizeObserver = SpyResizeObserver;
});

afterEach(() => {
  globalThis.ResizeObserver = originalResizeObserver;
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
    expect(liveObservers.size).toBe(1);
  });

  it('lets go of the element when the caller unmounts', () => {
    const { unmount } = render(<Probe wrapped={false} />);
    expect(liveObservers.size).toBe(1);

    unmount();
    expect(liveObservers.size).toBe(0);
  });
});
