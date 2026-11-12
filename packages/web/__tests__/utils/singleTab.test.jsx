import { afterEach, describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useSingleTab } from '../../app/utils/singleTab';

/** Stands in for Tamanu open in another tab, listening on the same channel. */
const openOtherTab = () => {
  const channel = new BroadcastChannel('tamanuSingleTab');
  const received = [];
  channel.addEventListener('message', event => received.push(event.data));
  return { channel, received };
};

const settle = () =>
  new Promise(resolve => {
    setTimeout(resolve, 50);
  });

describe('useSingleTab', () => {
  let otherTab;

  afterEach(() => {
    otherTab?.channel.close();
    window.history.pushState({}, '', '/');
  });

  it('steps aside for Tamanu already open in an older tab', async () => {
    window.history.pushState({}, '', '/dashboard');
    otherTab = openOtherTab();
    const { result } = renderHook(() => useSingleTab());

    await act(async () => {
      otherTab.channel.postMessage(0);
      await settle();
    });

    await waitFor(() => expect(result.current).toBe(false));
    expect(otherTab.received.length).toBeGreaterThan(0);
  });

  it('keeps a kiosk tab open beside Tamanu, without claiming the single tab', async () => {
    window.history.pushState({}, '', '/kiosk');
    otherTab = openOtherTab();
    const { result } = renderHook(() => useSingleTab());

    await act(async () => {
      otherTab.channel.postMessage(0);
      await settle();
    });

    expect(result.current).toBe(true);
    expect(otherTab.received).toEqual([]);
  });
});
