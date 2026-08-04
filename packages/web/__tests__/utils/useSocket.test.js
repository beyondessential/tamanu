import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

  beforeEach(async () => {
    // useSocket keeps the shared socket in module state, so each case needs a
    // fresh copy of the module (and of the mocked socket.io-client it captured).
    vi.resetModules();
    ({ default: io } = await import('socket.io-client'));
    io.mockClear();
    ({ useSocket } = await import('../../app/utils/useSocket'));
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
});
