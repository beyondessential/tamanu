import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import useOverflow from '../../app/hooks/useOverflow';

/**
 * The hook is deprecated and deliberately inert: measuring the DOM and feeding the result
 * back into render caused an infinite remount loop in production. These tests pin the inert
 * contract so it cannot quietly start measuring again before its usages are removed.
 */
class ThrowingObserver {
  constructor() {
    throw new Error('useOverflow must not observe the DOM');
  }
}

const originalResizeObserver = globalThis.ResizeObserver;
const originalMutationObserver = globalThis.MutationObserver;

beforeEach(() => {
  globalThis.ResizeObserver = ThrowingObserver;
  globalThis.MutationObserver = ThrowingObserver;
});

afterEach(() => {
  globalThis.ResizeObserver = originalResizeObserver;
  globalThis.MutationObserver = originalMutationObserver;
});

const Consumer = ({ text }) => {
  const [ref, isOverflowing] = useOverflow();
  return (
    <div ref={ref} data-testid="measured" data-overflowing={String(isOverflowing)}>
      {text}
    </div>
  );
};

describe('useOverflow', () => {
  it('always reports overflow without observing the element', () => {
    render(<Consumer text="some text" />);

    expect(screen.getByTestId('measured').getAttribute('data-overflowing')).toBe('true');
  });

  it('keeps reporting overflow when the element re-renders with different content', () => {
    const { rerender } = render(<Consumer text="short" />);
    rerender(<Consumer text="a much longer piece of text" />);

    expect(screen.getByTestId('measured').getAttribute('data-overflowing')).toBe('true');
  });
});
