import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CentralEndpointSelector,
  setCentralEndpointSelector,
} from '../../app/sync/CentralEndpointSelector';

// the client the service creates: a socket with a manager whose uri it can repoint
const sockets = [];
vi.mock('socket.io-client', () => ({
  io: vi.fn(uri => {
    const socket = Object.assign(new EventEmitter(), {
      io: { uri },
      disconnect: vi.fn(() => socket),
      connect: vi.fn(() => socket),
    });
    sockets.push(socket);
    return socket;
  }),
}));

const { defineWebsocketClientService } = await import('../../app/services/websocketClientService');

const A = 'https://a.example.com';
const B = 'https://b.example.com';

// spec: CEND
describe('websocketClientService', () => {
  beforeEach(() => {
    sockets.length = 0;
  });
  afterEach(() => setCentralEndpointSelector(null));

  const makeSelector = () =>
    new CentralEndpointSelector({
      models: { LocalSystemFact: { get: async () => null, set: async () => {} } },
      hosts: [A, B],
      getDeviceId: () => 'device',
      getProbeSettings: async () => ({ recheckIntervalMs: 1000, probeTimeoutMs: 100 }),
    });

  it('connects to the central endpoint in use', () => {
    const selector = makeSelector();
    setCentralEndpointSelector(selector);
    selector.adopt([A, B], B);

    defineWebsocketClientService({});

    expect(new URL(sockets[0].io.uri).origin).toBe(B);
  });

  it('reconnects to the new endpoint when it changes, keeping the socket and its listeners', async () => {
    const selector = makeSelector();
    setCentralEndpointSelector(selector);
    defineWebsocketClientService({});
    const [socket] = sockets;
    const listenersBefore = socket.eventNames();

    await selector.adopt([A, B], B);

    expect(new URL(socket.io.uri).origin).toBe(B);
    expect(socket.disconnect).toHaveBeenCalled();
    expect(socket.connect).toHaveBeenCalled();
    expect(sockets).toHaveLength(1);
    expect(socket.eventNames()).toEqual(listenersBefore);
  });
});
