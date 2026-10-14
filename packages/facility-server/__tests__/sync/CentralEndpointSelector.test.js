import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FACT_CENTRAL_ENDPOINT_IN_USE } from '@tamanu/constants';
import { InvalidCredentialError, RateLimitedError } from '@tamanu/errors';

import { CentralEndpointSelector } from '../../app/sync/CentralEndpointSelector';
import { SyncLoginBackoff, setSyncLoginBackoff } from '../../app/sync/SyncLoginBackoff';

const A = 'https://a.example.com';
const B = 'https://b.example.com';
const C = 'http://c.local';

const makeFacts = (initial = {}) => {
  const store = new Map(Object.entries(initial));
  return {
    store,
    LocalSystemFact: {
      get: async key => store.get(key) ?? null,
      set: async (key, value) => void store.set(key, value),
    },
  };
};

// `working` is the set of hosts whose login succeeds, `refusing` those that refuse the
// credentials and `locked` those that say the account is locked out; any other host cannot be
// reached. Every probe is recorded in `probed`.
const makeSelector = ({
  hosts = [A, B, C],
  working = new Set(hosts),
  refusing = new Set(),
  locked = new Set(),
  // which central each host's login says it reached
  identities = {},
  inUse,
  facts,
  canProbe,
} = {}) => {
  const probed = [];
  const factStore = facts ?? makeFacts();
  const selector = new CentralEndpointSelector({
    models: { LocalSystemFact: factStore.LocalSystemFact },
    hosts,
    inUse,
    getDeviceId: () => 'device-1',
    getProbeSettings: async () => ({ recheckIntervalMs: 1000, probeTimeoutMs: 50 }),
    canProbe,
    now: () => now,
    createProbeClient: ({ host }) => ({
      login: async () => {
        probed.push(host);
        if (refusing.has(host)) throw new InvalidCredentialError();
        if (locked.has(host)) throw new RateLimitedError(60);
        if (!working.has(host)) throw new Error(`cannot reach ${host}`);
        return { server: { centralHost: identities[host] } };
      },
    }),
  });
  return { selector, probed, working, refusing, facts: factStore };
};

// the login backoff is process-wide, so each test gets one of its own and a clock to move
let now;
const loginBackoff = () => {
  const backoff = new SyncLoginBackoff({
    getSettings: async () => ({ initialDelayMs: 120_000, maxDelayMs: 3_600_000 }),
    now: () => now,
    getCredentialKey: () => 'credentials',
  });
  setSyncLoginBackoff(backoff);
  return backoff;
};

// spec: CEND
describe('CentralEndpointSelector', () => {
  let backoff;
  beforeEach(() => {
    now = 1_000_000;
    backoff = loginBackoff();
  });
  afterEach(() => setSyncLoginBackoff(new SyncLoginBackoff()));

  describe('current', () => {
    it('starts on the first host', () => {
      expect(makeSelector().selector.current()).toBe(A);
    });

    it('starts on the host last in use when it is still in the list', () => {
      expect(makeSelector({ inUse: B }).selector.current()).toBe(B);
    });

    it('ignores a host last in use that is no longer in the list', () => {
      expect(makeSelector({ inUse: 'https://gone.example.com' }).selector.current()).toBe(A);
    });
  });

  describe('walk', () => {
    it('moves to the first host that passes a login, trying them in order', async () => {
      const { selector, probed } = makeSelector({ working: new Set([B, C]) });

      expect(await selector.walk()).toBe(true);

      expect(probed).toEqual([A, B]);
      expect(selector.current()).toBe(B);
    });

    it('goes back to the top when it is the first that passes', async () => {
      const { selector, probed } = makeSelector({ inUse: C });

      await selector.walk();

      expect(probed).toEqual([A]);
      expect(selector.current()).toBe(A);
    });

    it('stays put and reports failure when no host passes', async () => {
      const { selector, probed } = makeSelector({ working: new Set(), inUse: B });

      expect(await selector.walk()).toBe(false);

      expect(probed).toEqual([A, B, C]);
      expect(selector.current()).toBe(B);
    });

    it('does not probe anything when there is only one host', async () => {
      const { selector, probed } = makeSelector({ hosts: [A] });

      expect(await selector.walk()).toBe(false);
      expect(probed).toEqual([]);
    });

    it('shares one walk between concurrent callers', async () => {
      const { selector, probed } = makeSelector({ working: new Set([B]) });

      await Promise.all([selector.walk(), selector.walk(), selector.walk()]);

      expect(probed).toEqual([A, B]);
    });

    it('publishes the host it moves to and tells listeners', async () => {
      const { selector, facts } = makeSelector({ working: new Set([B]) });
      const onChange = vi.fn();
      selector.on('change', onChange);

      await selector.walk();

      expect(facts.store.get(FACT_CENTRAL_ENDPOINT_IN_USE)).toBe(B);
      expect(onChange).toHaveBeenCalledExactlyOnceWith(B);
    });

    it('does not tell listeners when it stays on the same host', async () => {
      const { selector } = makeSelector();
      const onChange = vi.fn();
      selector.on('change', onChange);

      expect(await selector.walk()).toBe(true);

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('when walking after a refused login', () => {
    it('does not ask the host to skip again', async () => {
      const { selector, probed } = makeSelector({ working: new Set([B]), refusing: new Set([A]) });

      expect(await selector.walk({ skip: [A] })).toBe(true);

      expect(probed).toEqual([B]);
      expect(selector.current()).toBe(B);
    });

    it('still tries every other host, since one may be a different Tamanu', async () => {
      const { selector, probed } = makeSelector({
        working: new Set([C]),
        refusing: new Set([A, B]),
      });

      expect(await selector.walk({ skip: [A] })).toBe(true);

      expect(probed).toEqual([B, C]);
      expect(selector.current()).toBe(C);
    });
  });

  describe('which central a host reaches', () => {
    const SAME = { [A]: 'central-1', [C]: 'central-1', [B]: 'central-2' };

    it('is learned from a successful probe', async () => {
      const { selector } = makeSelector({ identities: SAME });

      await selector.probe(A);
      await selector.probe(C);
      await selector.probe(B);

      expect(selector.hostsOnSameServerAs(A)).toEqual([A, C]);
      expect(selector.hostsOnSameServerAs(B)).toEqual([B]);
    });

    it('is not known for a host that has not logged in, or one whose login named no central', async () => {
      const { selector } = makeSelector({ identities: { [A]: 'central-1' } });
      await selector.probe(A);
      await selector.probe(B);

      expect(selector.hostsOnSameServerAs(A)).toEqual([A]);
      expect(selector.hostsOnSameServerAs(C)).toEqual([C]);
    });

    it('is not learned from a refused login, which names nothing', async () => {
      const { selector } = makeSelector({ refusing: new Set([A]), identities: SAME });

      await selector.probe(A);

      expect(selector.hostsOnSameServerAs(A)).toEqual([A]);
    });

    it('is forgotten after an hour, since a name can start pointing at another server', async () => {
      const { selector } = makeSelector({ identities: SAME });
      await selector.probe(A);
      await selector.probe(C);

      now += 59 * 60_000;
      expect(selector.hostsOnSameServerAs(A)).toEqual([A, C]);

      now += 2 * 60_000;
      expect(selector.hostsOnSameServerAs(A)).toEqual([A]);
    });

    it('is learned again by the next successful login', async () => {
      const { selector } = makeSelector({ identities: SAME });
      await selector.probe(A);
      now += 61 * 60_000;
      expect(selector.hostsOnSameServerAs(A)).toEqual([A]);

      await selector.probe(A);
      await selector.probe(C);

      expect(selector.hostsOnSameServerAs(A)).toEqual([A, C]);
    });

    it('lets a round skip the hosts that reach the central that refused', async () => {
      const identities = { [A]: 'central-1', [C]: 'central-1', [B]: 'central-2' };
      const { selector, probed, refusing } = makeSelector({ identities });
      await selector.probe(A);
      await selector.probe(B);
      await selector.probe(C);
      probed.length = 0;

      // the credentials stop working at central-1, whose two names are A and C
      refusing.add(A);
      refusing.add(C);

      expect(await selector.firstPassing([A, C, B])).toBe(B);

      expect(probed).toEqual([A, B]);
    });

    it('still tries a host of unknown identity after a refusal', async () => {
      const { selector, probed } = makeSelector({
        refusing: new Set([A]),
        working: new Set([B, C]),
        identities: { [A]: 'central-1' },
      });
      await selector.probe(A).catch(() => {});

      expect(await selector.firstPassing([A, B])).toBe(B);
      expect(probed).toEqual([A, A, B]);
    });
  });

  describe('firstPassing', () => {
    it('resolves to the first host that passes, and skips the ones it is told to', async () => {
      const { selector, probed } = makeSelector();

      expect(await selector.firstPassing([A, B, C], { skip: [A] })).toBe(B);
      expect(probed).toEqual([B]);
    });

    it('resolves to null when none passes', async () => {
      const { selector } = makeSelector({ working: new Set() });
      expect(await selector.firstPassing([A, B])).toBeNull();
    });

    it('pauses logins once, however many hosts refused the credentials', async () => {
      const { selector, probed } = makeSelector({
        refusing: new Set([A, B, C]),
        working: new Set(),
      });

      expect(await selector.firstPassing([A, B, C])).toBeNull();

      expect(probed).toEqual([A, B, C]);
      expect(backoff.isOpen()).toBe(false);
      now += 120_000;
      expect(backoff.isOpen()).toBe(true);
    });

    it('does not pause for hosts that were merely unreachable', async () => {
      const { selector } = makeSelector({ working: new Set() });

      await selector.firstPassing([A, B, C]);

      expect(backoff.isOpen()).toBe(true);
    });

    it('does not pause when a host passed after another refused', async () => {
      const { selector } = makeSelector({ refusing: new Set([A]), working: new Set([B]) });

      expect(await selector.firstPassing([A, B])).toBe(B);

      expect(backoff.isOpen()).toBe(true);
    });

    it('ends a pause that earlier refusals began', async () => {
      await backoff.recordRefusal();
      now += 120_000;
      const { selector } = makeSelector();

      await selector.firstPassing([A]);

      await backoff.recordRefusal();
      // the schedule started over, rather than moving on to the second step
      now += 120_000;
      expect(backoff.isOpen()).toBe(true);
    });

    it('stops at a lockout rather than asking the other hosts', async () => {
      const { selector, probed } = makeSelector({ locked: new Set([A]), working: new Set([B, C]) });

      expect(await selector.firstPassing([A, B, C])).toBeNull();

      expect(probed).toEqual([A]);
      expect(backoff.isOpen()).toBe(false);
    });

    it('does not probe anything while logins are paused', async () => {
      await backoff.recordRefusal();
      const { selector, probed } = makeSelector();

      expect(await selector.firstPassing([A, B])).toBeNull();
      expect(probed).toEqual([]);
    });

    it('gives the round up when told to stop', async () => {
      const { selector, probed } = makeSelector({ working: new Set() });
      let probes = 0;

      await selector.firstPassing([A, B, C], { shouldStop: () => probes++ >= 1 });

      expect(probed).toEqual([A]);
    });
  });

  describe('while logins are paused', () => {
    it('walks and rechecks probe nothing, so a recheck cannot add failures during a pause', async () => {
      await backoff.recordRefusal();
      const { selector, probed } = makeSelector({ inUse: B });

      expect(await selector.walk()).toBe(false);
      expect(await selector.recheckEarlier()).toBe(false);

      expect(probed).toEqual([]);
      expect(selector.current()).toBe(B);
    });
  });

  describe('recheckEarlier', () => {
    it('moves to the highest-priority earlier host that passes', async () => {
      const { selector, probed } = makeSelector({ inUse: C, working: new Set([B, C]) });

      expect(await selector.recheckEarlier()).toBe(true);

      expect(probed).toEqual([A, B]);
      expect(selector.current()).toBe(B);
    });

    it('does not probe when already on the first host', async () => {
      const { selector, probed } = makeSelector();

      expect(await selector.recheckEarlier()).toBe(false);
      expect(probed).toEqual([]);
    });

    it('never probes the host in use or later ones', async () => {
      const { selector, probed } = makeSelector({ inUse: B, working: new Set([C]) });

      await selector.recheckEarlier();

      expect(probed).toEqual([A]);
      expect(selector.current()).toBe(B);
    });

    it('stays put when no earlier host passes', async () => {
      const { selector } = makeSelector({ inUse: C, working: new Set([C]) });

      expect(await selector.recheckEarlier()).toBe(false);
      expect(selector.current()).toBe(C);
    });

    it('waits for a sync session in progress to finish', async () => {
      const { selector, probed } = makeSelector({ inUse: B });

      selector.beginSession();
      expect(await selector.recheckEarlier()).toBe(false);
      expect(probed).toEqual([]);

      selector.endSession();
      expect(await selector.recheckEarlier()).toBe(true);
      expect(selector.current()).toBe(A);
    });

    it('stops probing once a session starts, even while earlier hosts keep failing', async () => {
      const D = 'https://d.example.com';
      const { selector, probed } = makeSelector({
        hosts: [A, B, C, D],
        inUse: D,
        working: new Set([D]),
      });
      const realProbe = selector.probe.bind(selector);
      selector.probe = async host => {
        const result = await realProbe(host);
        selector.beginSession();
        return result;
      };

      expect(await selector.recheckEarlier()).toBe(false);

      expect(probed).toEqual([A]);
      expect(selector.current()).toBe(D);
    });

    it('does not move when a session started while it was probing', async () => {
      const { selector } = makeSelector({ inUse: B });
      const slowProbe = selector.probe.bind(selector);
      selector.probe = async host => {
        const result = await slowProbe(host);
        selector.beginSession();
        return result;
      };

      expect(await selector.recheckEarlier()).toBe(false);
      expect(selector.current()).toBe(B);
    });
  });

  describe('canFailOver', () => {
    it('is true with alternatives and no session running', () => {
      expect(makeSelector().selector.canFailOver()).toBe(true);
    });

    it('is false with a single host', () => {
      expect(makeSelector({ hosts: [A] }).selector.canFailOver()).toBe(false);
    });

    it('is false while a sync session is running', () => {
      const { selector } = makeSelector();
      selector.beginSession();
      expect(selector.canFailOver()).toBe(false);
      selector.endSession();
      expect(selector.canFailOver()).toBe(true);
    });

    it('is false in a process that only follows', () => {
      expect(makeSelector({ canProbe: false }).selector.canFailOver()).toBe(false);
    });
  });

  describe('in a process that only follows', () => {
    it('never walks, probes or publishes', async () => {
      const { selector, probed, facts } = makeSelector({ canProbe: false, working: new Set([B]) });

      expect(await selector.walk()).toBe(false);

      expect(probed).toEqual([]);
      expect(selector.current()).toBe(A);
      expect(facts.store.has(FACT_CENTRAL_ENDPOINT_IN_USE)).toBe(false);
    });

    it('never rechecks', async () => {
      const { selector, probed } = makeSelector({ canProbe: false, inUse: C });

      expect(await selector.recheckEarlier()).toBe(false);
      expect(probed).toEqual([]);
    });
  });

  describe('adopt', () => {
    it('replaces the list and uses the verified host', async () => {
      const { selector, facts } = makeSelector({ hosts: [A] });

      await selector.adopt([B, C], C);

      expect(selector.hosts).toEqual([B, C]);
      expect(selector.current()).toBe(C);
      expect(facts.store.get(FACT_CENTRAL_ENDPOINT_IN_USE)).toBe(C);
    });
  });

  describe('probe', () => {
    it('logs in on a client of its own and reports the reason for a failure', async () => {
      const { selector } = makeSelector({ working: new Set() });

      const result = await selector.probe(A);

      expect(result).toEqual({
        ok: false,
        reason: `cannot reach ${A}`,
        credentialsRefused: false,
        lockedOut: false,
      });
    });
  });

  describe('follow', () => {
    let stop;
    afterEach(() => stop?.());
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('takes the host the sync process publishes, without probing or republishing', async () => {
      const facts = makeFacts({ [FACT_CENTRAL_ENDPOINT_IN_USE]: B });
      const { selector, probed } = makeSelector({ facts });
      const onChange = vi.fn();
      selector.on('change', onChange);

      stop = selector.follow(1000);
      await vi.advanceTimersByTimeAsync(0);

      expect(selector.current()).toBe(B);
      expect(onChange).toHaveBeenCalledExactlyOnceWith(B);
      expect(probed).toEqual([]);
    });

    it('keeps following as the published host changes', async () => {
      const facts = makeFacts({ [FACT_CENTRAL_ENDPOINT_IN_USE]: B });
      const { selector } = makeSelector({ facts });
      stop = selector.follow(1000);
      await vi.advanceTimersByTimeAsync(0);

      facts.store.set(FACT_CENTRAL_ENDPOINT_IN_USE, A);
      await vi.advanceTimersByTimeAsync(1000);

      expect(selector.current()).toBe(A);
    });

    it('follows a host published from a list it has not seen', async () => {
      const facts = makeFacts({ [FACT_CENTRAL_ENDPOINT_IN_USE]: 'https://new.example.com' });
      const { selector } = makeSelector({ facts, hosts: [A] });

      stop = selector.follow(1000);
      await vi.advanceTimersByTimeAsync(0);

      expect(selector.current()).toBe('https://new.example.com');
    });
  });

  describe('startRechecking', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('rechecks earlier hosts on the interval from settings until stopped', async () => {
      const { selector, probed } = makeSelector({ inUse: B, working: new Set([B]) });

      const stop = selector.startRechecking();
      await vi.advanceTimersByTimeAsync(0);
      expect(probed).toEqual([]);

      await vi.advanceTimersByTimeAsync(1000);
      expect(probed).toEqual([A]);

      await vi.advanceTimersByTimeAsync(1000);
      expect(probed).toEqual([A, A]);

      stop();
      await vi.advanceTimersByTimeAsync(5000);
      expect(probed).toEqual([A, A]);
    });

    it('moves back up once the earlier host passes again', async () => {
      const { selector, working } = makeSelector({ inUse: B, working: new Set([B]) });
      const stop = selector.startRechecking();

      await vi.advanceTimersByTimeAsync(1000);
      expect(selector.current()).toBe(B);

      working.add(A);
      await vi.advanceTimersByTimeAsync(1000);
      expect(selector.current()).toBe(A);

      stop();
    });
  });
});
