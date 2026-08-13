import { render, renderHook } from '@testing-library/react';
import React, { StrictMode, useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('socket.io-client', () => ({
  default: vi.fn(() => ({
    disconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  })),
}));

describe('useSocket', () => {
  let io;
  let useSocket;
  let releaseSharedSocketForTestsOnly;

  beforeEach(async () => {
    // useSocket keeps the shared socket in module state, so each case needs a
    // fresh copy of the module (and of the mocked socket.io-client it captured).
    vi.resetModules();
    ({ default: io } = await import('socket.io-client'));
    io.mockClear();
    ({ useSocket, releaseSharedSocketForTestsOnly } = await import('../../app/utils/useSocket'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Consumers of the hook attach their listeners in their own effect, to the
  // socket they were handed during render, so the socket they saw at that point is
  // what matters — not whatever the shared socket has become since.
  const socketsListenersWereAttachedTo = [];

  const Consumer = () => {
    const { socket } = useSocket();
    useEffect(() => {
      socketsListenersWereAttachedTo.push(socket);
      // eslint-disable-next-line react-hooks/exhaustive-deps -- mirrors consumers that attach once
    }, []);
    return null;
  };

  beforeEach(() => {
    socketsListenersWereAttachedTo.length = 0;
  });

  it('opens one socket shared by every consumer', () => {
    const firstConsumer = renderHook(() => useSocket());
    const secondConsumer = renderHook(() => useSocket());

    expect(io).toHaveBeenCalledTimes(1);
    expect(firstConsumer.result.current.socket).toBe(secondConsumer.result.current.socket);
  });

  it('connects over websocket on the Tamanu socket path', async () => {
    const { WS_PATH } = await import('@tamanu/constants');
    renderHook(() => useSocket());

    expect(io).toHaveBeenCalledWith('', { path: WS_PATH, transports: ['websocket'] });
  });

  it('keeps the socket connected while another consumer is still mounted', () => {
    const firstConsumer = renderHook(() => useSocket());
    const secondConsumer = renderHook(() => useSocket());
    const { socket } = firstConsumer.result.current;

    firstConsumer.unmount();
    expect(socket.disconnect).not.toHaveBeenCalled();
    expect(secondConsumer.result.current.socket).toBe(socket);

    secondConsumer.unmount();
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
  });

  it('opens a new socket when a consumer mounts after the last one unmounted', () => {
    const firstConsumer = renderHook(() => useSocket());
    const firstSocket = firstConsumer.result.current.socket;
    firstConsumer.unmount();

    const secondConsumer = renderHook(() => useSocket());

    expect(io).toHaveBeenCalledTimes(2);
    expect(secondConsumer.result.current.socket).not.toBe(firstSocket);
    expect(secondConsumer.result.current.socket.disconnect).not.toHaveBeenCalled();
  });

  it('keeps the socket connected when one consumer replaces another in a single render', () => {
    // React runs the unmounting consumer's cleanup before the mounting one's
    // effects, so the socket has to survive the handover within the one commit.
    const App = ({ isSecondConsumerShown }) =>
      isSecondConsumerShown ? <Consumer key="second" /> : <Consumer key="first" />;

    const { rerender } = render(<App isSecondConsumerShown={false} />);
    rerender(<App isSecondConsumerShown />);

    const [socketOfFirstConsumer, socketOfSecondConsumer] = socketsListenersWereAttachedTo;
    expect(socketOfSecondConsumer.disconnect).not.toHaveBeenCalled();
    expect(socketOfSecondConsumer).toBe(socketOfFirstConsumer);
    expect(io).toHaveBeenCalledTimes(1);
  });

  it('keeps the socket connected when StrictMode re-runs a consumer effect', () => {
    const { unmount } = render(
      <StrictMode>
        <Consumer />
      </StrictMode>,
    );

    const [socket] = socketsListenersWereAttachedTo;
    expect(io).toHaveBeenCalledTimes(1);
    expect(socket.disconnect).not.toHaveBeenCalled();

    unmount();
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
  });

  it('reports a release that was never acquired, and keeps the count out of the negatives', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderHook(() => useSocket()).unmount();

    releaseSharedSocketForTestsOnly();

    expect(consoleError).toHaveBeenCalledTimes(1);

    // The count was clamped rather than left negative, so consumers mounting
    // afterwards are unaffected by the imbalance.
    const firstConsumer = renderHook(() => useSocket());
    const secondConsumer = renderHook(() => useSocket());
    const { socket } = secondConsumer.result.current;

    firstConsumer.unmount();
    expect(socket.disconnect).not.toHaveBeenCalled();

    secondConsumer.unmount();
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
  });
});
