import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NOTIFY_CHANNELS } from '@tamanu/constants';

const { clients, state } = vi.hoisted(() => ({ clients: [], state: { connectBehaviour: null } }));

vi.mock('pg', async () => {
  const { EventEmitter } = await import('node:events');
  class FakeClient extends EventEmitter {
    queries = [];
    ended = false;
    constructor(options) {
      super();
      this.options = options;
      clients.push(this);
    }
    connect() {
      return state.connectBehaviour(this);
    }
    query(sql) {
      this.queries.push(sql);
      return Promise.resolve();
    }
    escapeIdentifier(identifier) {
      return `"${identifier}"`;
    }
    end() {
      this.ended = true;
      return Promise.resolve();
    }
  }
  return { default: { Client: FakeClient } };
});

vi.mock('../../../src/services/logging', () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const { defineDbNotifier } = await import('../../../src/services/dbNotifier');

const config = { host: 'db', port: 5432, username: 'u', password: 'p', database: 'd' };
const CHANNEL = NOTIFY_CHANNELS.TABLE_CHANGED;
const define = (options = {}) =>
  defineDbNotifier(config, [CHANNEL], { onOutageExceeded: vi.fn(), ...options });
const refused = () => Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });

describe('defineDbNotifier', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clients.length = 0;
    state.connectBehaviour = () => Promise.resolve();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('listens on the requested channels and passes parsed payloads to listeners', async () => {
    const notifier = await define();
    const received = [];
    notifier.listeners[CHANNEL](payload => received.push(payload));

    expect(clients[0].queries).toEqual([`LISTEN "${CHANNEL}"`]);
    clients[0].emit('notification', { channel: CHANNEL, payload: '{"table":"settings"}' });
    clients[0].emit('notification', { channel: CHANNEL, payload: 'not json' });
    await vi.advanceTimersByTimeAsync(0);

    expect(received).toEqual([{ table: 'settings' }, 'not json']);
    await notifier.close();
  });

  it('keeps retrying at startup while the database refuses connections', async () => {
    let attempts = 0;
    state.connectBehaviour = () => (++attempts < 4 ? Promise.reject(refused()) : Promise.resolve());

    const pending = define();
    await vi.advanceTimersByTimeAsync(60_000);
    const notifier = await pending;

    expect(attempts).toBe(4);
    expect(clients.at(-1).queries).toEqual([`LISTEN "${CHANNEL}"`]);
    await notifier.close();
  });

  it('does not retry errors that are not transient', async () => {
    state.connectBehaviour = () => Promise.reject(Object.assign(new Error('bad password'), { code: '28P01' }));

    await expect(define()).rejects.toThrow('bad password');
    expect(clients).toHaveLength(1);
  });

  it('reconnects, listens again and signals when the connection is lost', async () => {
    const notifier = await define();
    const onReconnect = vi.fn();
    notifier.onReconnect(onReconnect);
    const received = [];
    notifier.listeners[CHANNEL](payload => received.push(payload));

    let failures = 0;
    state.connectBehaviour = () => (++failures <= 2 ? Promise.reject(refused()) : Promise.resolve());
    clients[0].emit('error', new Error('terminating connection due to administrator command'));
    clients[0].emit('end'); // pg emits both; must trigger only one reconnect
    await vi.advanceTimersByTimeAsync(60_000);

    expect(failures).toBe(3);
    expect(clients[0].ended).toBe(true);
    expect(onReconnect).toHaveBeenCalledTimes(1);
    const live = clients.at(-1);
    expect(live.queries).toEqual([`LISTEN "${CHANNEL}"`]);

    live.emit('notification', { channel: CHANNEL, payload: '{"table":"settings"}' });
    await vi.advanceTimersByTimeAsync(0);
    expect(received).toEqual([{ table: 'settings' }]);
    await notifier.close();
  });

  it('gives up only once the outage outlasts the tolerance', async () => {
    const onOutageExceeded = vi.fn();
    const notifier = await define({ outageToleranceMs: 30_000, onOutageExceeded });

    state.connectBehaviour = () => Promise.reject(refused());
    clients[0].emit('error', new Error('connection terminated'));

    await vi.advanceTimersByTimeAsync(20_000);
    expect(onOutageExceeded).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(60_000);
    expect(onOutageExceeded).toHaveBeenCalledTimes(1);
    await notifier.close();
  });

  it('stops reconnecting once closed', async () => {
    const onOutageExceeded = vi.fn();
    const notifier = await define({ onOutageExceeded });

    state.connectBehaviour = () => Promise.reject(refused());
    clients[0].emit('error', new Error('connection terminated'));
    await vi.advanceTimersByTimeAsync(1_000);
    const attemptsBeforeClose = clients.length;

    await notifier.close();
    await vi.advanceTimersByTimeAsync(600_000);

    expect(clients).toHaveLength(attemptsBeforeClose);
    expect(onOutageExceeded).not.toHaveBeenCalled();
  });

  it('requires the caller to choose what happens when the outage outlasts the tolerance', async () => {
    await expect(defineDbNotifier(config, [CHANNEL], {})).rejects.toThrow(/onOutageExceeded/);
  });

  it('bounds each connection attempt so a hung handshake cannot stall the retries', async () => {
    const notifier = await define();
    expect(clients[0].options.connectionTimeoutMillis).toBeGreaterThan(0);
    await notifier.close();
  });

  it('ends an attempt still in flight when closed', async () => {
    const notifier = await define();
    state.connectBehaviour = () => new Promise(() => {}); // hangs
    clients[0].emit('error', new Error('connection terminated'));
    await vi.advanceTimersByTimeAsync(0);
    const inFlight = clients.at(-1);
    expect(inFlight).not.toBe(clients[0]);

    await notifier.close();
    expect(inFlight.ended).toBe(true);
  });
});
