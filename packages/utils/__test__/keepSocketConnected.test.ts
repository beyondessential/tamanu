import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { keepSocketConnected } from '../src/keepSocketConnected';

class FakeSocket extends EventEmitter {
  active = false;
  connect = vi.fn();
}

describe('keepSocketConnected', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('refreshes the credentials, then reconnects, after the handshake is refused', async () => {
    const socket = new FakeSocket();
    const calls: string[] = [];
    socket.connect.mockImplementation(() => calls.push('connect'));
    keepSocketConnected(socket, {
      refreshCredentials: async () => {
        calls.push('refresh');
      },
    });

    socket.emit('connect_error', new Error('Unauthorised'));
    await vi.advanceTimersByTimeAsync(5_000);

    expect(calls).toEqual(['refresh', 'connect']);
  });

  it('reconnects after the server ends the connection', async () => {
    const socket = new FakeSocket();
    keepSocketConnected(socket);

    socket.emit('disconnect', 'io server disconnect');
    await vi.advanceTimersByTimeAsync(5_000);

    expect(socket.connect).toHaveBeenCalledTimes(1);
  });

  it('reconnects even when refreshing the credentials fails', async () => {
    const socket = new FakeSocket();
    keepSocketConnected(socket, { refreshCredentials: () => Promise.reject(new Error('down')) });

    socket.emit('connect_error', new Error('Unauthorised'));
    await vi.advanceTimersByTimeAsync(5_000);

    expect(socket.connect).toHaveBeenCalledTimes(1);
  });

  it('leaves retrying to socket.io while the socket is still active', async () => {
    const socket = new FakeSocket();
    socket.active = true;
    keepSocketConnected(socket);

    socket.emit('connect_error', new Error('xhr poll error'));
    await vi.advanceTimersByTimeAsync(60_000);

    expect(socket.connect).not.toHaveBeenCalled();
  });

  it('keeps one retry pending at a time', async () => {
    const socket = new FakeSocket();
    keepSocketConnected(socket);

    socket.emit('disconnect', 'io server disconnect');
    socket.emit('connect_error', new Error('Unauthorised'));
    await vi.advanceTimersByTimeAsync(5_000);

    expect(socket.connect).toHaveBeenCalledTimes(1);
  });

  it('waits longer after each failed retry, and starts over once connected', async () => {
    const socket = new FakeSocket();
    keepSocketConnected(socket);

    socket.emit('connect_error', new Error('Unauthorised'));
    await vi.advanceTimersByTimeAsync(5_000);
    socket.emit('connect_error', new Error('Unauthorised'));
    await vi.advanceTimersByTimeAsync(9_999);
    expect(socket.connect).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(socket.connect).toHaveBeenCalledTimes(2);

    socket.emit('connect');
    socket.emit('disconnect', 'io server disconnect');
    await vi.advanceTimersByTimeAsync(5_000);
    expect(socket.connect).toHaveBeenCalledTimes(3);
  });

  it('stops retrying once stopped', async () => {
    const socket = new FakeSocket();
    const stop = keepSocketConnected(socket);

    socket.emit('connect_error', new Error('Unauthorised'));
    stop();
    socket.emit('disconnect', 'io client disconnect');
    await vi.advanceTimersByTimeAsync(60_000);

    expect(socket.connect).not.toHaveBeenCalled();
  });
});
