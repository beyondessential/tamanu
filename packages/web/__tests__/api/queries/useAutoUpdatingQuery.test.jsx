import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

import { createQueryClient } from '../../helpers';
import { useAutoUpdatingQuery } from '../../../app/api/queries/useAutoUpdatingQuery';

const { getMock, socketMock } = vi.hoisted(() => {
  const handlers = new Map();
  return {
    getMock: vi.fn(),
    socketMock: {
      handlers,
      on: (channel, handler) => {
        if (!handlers.has(channel)) handlers.set(channel, new Set());
        handlers.get(channel).add(handler);
      },
      off: (channel, handler) => handlers.get(channel)?.delete(handler),
      broadcast: channel => [...(handlers.get(channel) ?? [])].forEach(handler => handler()),
    },
  };
});

vi.mock('../../../app/api/useApi', () => ({ useApi: () => ({ get: getMock }) }));
vi.mock('../../../app/utils/useSocket', () => ({ useSocket: () => ({ socket: socketMock }) }));

const CHANNEL = 'clinician-dashboard:tasks-update:facility:facility-1';

// The longest delay the hook can pick: debounce ceiling plus the full jitter window.
const LONGER_THAN_ANY_DELAY_MS = 6000;

// Callers pass the channel list and query params as inline literals, so every render
// produces fresh object identities. Mirror that here — a hook that keys its socket
// effect on those identities behaves quite differently from one that doesn't.
const renderAutoUpdatingQuery = client =>
  renderHook(() => useAutoUpdatingQuery('user/tasks', { page: 0 }, [CHANNEL], {}), {
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });

describe('useAutoUpdatingQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getMock.mockClear();
    getMock.mockResolvedValue({ data: [], count: 0 });
    socketMock.handlers.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('collapses a burst of update events into a single invalidation', () => {
    const client = createQueryClient();
    const invalidateQueries = vi.spyOn(client, 'invalidateQueries');
    renderAutoUpdatingQuery(client);

    act(() => {
      socketMock.broadcast(CHANNEL);
      socketMock.broadcast(CHANNEL);
      socketMock.broadcast(CHANNEL);
    });
    expect(invalidateQueries).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(LONGER_THAN_ANY_DELAY_MS));
    expect(invalidateQueries).toHaveBeenCalledTimes(1);
  });

  it('keeps collapsing events across a re-render', () => {
    const client = createQueryClient();
    const invalidateQueries = vi.spyOn(client, 'invalidateQueries');
    const { rerender } = renderAutoUpdatingQuery(client);

    act(() => socketMock.broadcast(CHANNEL));
    act(() => rerender());
    act(() => socketMock.broadcast(CHANNEL));
    act(() => vi.advanceTimersByTime(LONGER_THAN_ANY_DELAY_MS));

    // Rebuilding the debouncer on every render would let each event through separately.
    expect(invalidateQueries).toHaveBeenCalledTimes(1);
  });

  it('spreads concurrent clients across the jitter window rather than firing together', () => {
    // Two clients receiving the same broadcast must not refetch at the same instant.
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(1);

    const firstClient = createQueryClient();
    const secondClient = createQueryClient();
    const invalidateFirst = vi.spyOn(firstClient, 'invalidateQueries');
    const invalidateSecond = vi.spyOn(secondClient, 'invalidateQueries');
    renderAutoUpdatingQuery(firstClient);
    renderAutoUpdatingQuery(secondClient);

    act(() => socketMock.broadcast(CHANNEL));

    // At the un-jittered debounce delay only the client that drew no jitter has fired.
    act(() => vi.advanceTimersByTime(1000));
    expect(invalidateFirst).toHaveBeenCalledTimes(1);
    expect(invalidateSecond).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(LONGER_THAN_ANY_DELAY_MS));
    expect(invalidateSecond).toHaveBeenCalledTimes(1);
  });

  it('stops invalidating once unmounted', () => {
    const client = createQueryClient();
    const invalidateQueries = vi.spyOn(client, 'invalidateQueries');
    const { unmount } = renderAutoUpdatingQuery(client);

    act(() => socketMock.broadcast(CHANNEL));
    unmount();
    act(() => vi.advanceTimersByTime(LONGER_THAN_ANY_DELAY_MS));

    expect(invalidateQueries).not.toHaveBeenCalled();
  });
});
