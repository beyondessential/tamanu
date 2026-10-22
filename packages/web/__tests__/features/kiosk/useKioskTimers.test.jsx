import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useInactivityTimer, useKeepSignedIn } from '../../../app/views/kiosk/useKioskTimers';

const refreshToken = vi.fn(() => Promise.resolve());
vi.mock('../../../app/contexts/Auth', () => ({
  useAuth: () => ({ refreshToken }),
}));

describe('Kiosk timers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    refreshToken.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderInactivity = (props = {}) => {
    const onExpire = vi.fn();
    const hook = renderHook(
      ({ isEnabled }) =>
        useInactivityTimer({ isEnabled, timeoutSeconds: 10, warningSeconds: 5, onExpire }),
      { initialProps: { isEnabled: true, ...props } },
    );
    return { ...hook, onExpire };
  };

  const advanceSeconds = seconds =>
    act(() => {
      vi.advanceTimersByTime(seconds * 1000);
    });

  it('warns after the idle period, counts down, then ends the session', () => {
    const { result, onExpire } = renderInactivity();
    advanceSeconds(9);
    expect(result.current.isWarning).toBe(false);
    advanceSeconds(2);
    expect(result.current.isWarning).toBe(true);
    expect(result.current.secondsRemaining).toBe(4);
    expect(onExpire).not.toHaveBeenCalled();
    advanceSeconds(4);
    expect(onExpire).toHaveBeenCalled();
  });

  it('does not re-render the kiosk each second before the warning', () => {
    const { result } = renderInactivity();
    const beforeTicks = result.current;
    advanceSeconds(5);
    // An unchanged result object means no state changed, so nothing below the hook re-rendered
    expect(result.current).toBe(beforeTicks);
    advanceSeconds(6);
    expect(result.current).not.toBe(beforeTicks);
    expect(result.current.isWarning).toBe(true);
  });

  it('restarts the idle period on interaction before the warning', () => {
    const { result } = renderInactivity();
    advanceSeconds(8);
    act(() => result.current.recordActivity());
    advanceSeconds(8);
    expect(result.current.isWarning).toBe(false);
  });

  it('only an explicit dismissal clears the warning', () => {
    const { result, onExpire } = renderInactivity();
    advanceSeconds(11);
    act(() => result.current.recordActivity());
    advanceSeconds(1);
    expect(result.current.isWarning).toBe(true);
    act(() => result.current.dismissWarning());
    expect(result.current.isWarning).toBe(false);
    advanceSeconds(9);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('does not run while no session is open', () => {
    const { result, onExpire } = renderInactivity({ isEnabled: false });
    advanceSeconds(60);
    expect(result.current.isWarning).toBe(false);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('renews the sign-in regularly so the kiosk outlasts the token', () => {
    renderHook(() => useKeepSignedIn());
    expect(refreshToken).not.toHaveBeenCalled();
    advanceSeconds(5 * 60);
    expect(refreshToken).toHaveBeenCalledTimes(1);
    advanceSeconds(55 * 60);
    expect(refreshToken).toHaveBeenCalledTimes(12);
  });
});
