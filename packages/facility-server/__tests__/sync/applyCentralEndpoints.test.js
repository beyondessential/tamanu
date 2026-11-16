import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { FACT_CENTRAL_ENDPOINTS, SETTINGS_SCOPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';

import { applyCentralEndpoints } from '../../app/sync/applyCentralEndpoints';
import { initServerConfig } from '../../app/serverConfig';
import { createTestContext } from '../utilities';

const KEY = 'sync.centralEndpoints';
const FACILITY_A = 'endpoints-facility-a';
const FACILITY_B = 'endpoints-facility-b';
const OTHER_FACILITY = 'endpoints-other-facility';
const SEED = 'https://seed.example.com';

const A = 'https://a.example.com';
const B = 'https://b.example.com';
const C = 'http://c.local';

// A selector stand-in that records what it was asked, with `working` hosts passing the login
const makeSelector = ({ hosts = [SEED], working = new Set() } = {}) => {
  const state = { hosts, inUse: hosts[0], probed: [] };
  return {
    state,
    get hosts() {
      return state.hosts;
    },
    firstPassing: async candidates => {
      for (const host of candidates) {
        state.probed.push(host);
        if (working.has(host)) return host;
      }
      return null;
    },
    adopt: async (nextHosts, verified) => {
      state.hosts = nextHosts;
      state.inUse = verified;
    },
  };
};

// spec: CEND
describe('applyCentralEndpoints', () => {
  let ctx;
  let models;
  let setEndpoints;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    setEndpoints = (list, scope, facilityId = null) =>
      models.Setting.set(KEY, list, scope, facilityId);

    for (const id of [FACILITY_A, FACILITY_B, OTHER_FACILITY]) {
      await models.Facility.findOrCreate({
        where: { id },
        defaults: fake(models.Facility, { id, name: id }),
      });
    }
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.Setting.destroy({ where: { key: KEY }, force: true });
    await models.LocalSystemFact.destroy({ where: { key: FACT_CENTRAL_ENDPOINTS }, force: true });
  });

  const apply = (selector, facilityIds = [FACILITY_A]) =>
    applyCentralEndpoints({ models, selector, facilityIds });

  const recorded = async () => {
    const value = await models.LocalSystemFact.get(FACT_CENTRAL_ENDPOINTS);
    return value ? JSON.parse(value) : null;
  };

  it('does nothing when central supplies no endpoints', async () => {
    const selector = makeSelector();

    expect(await apply(selector)).toEqual({ applied: false, reason: 'empty' });

    expect(selector.state.probed).toEqual([]);
    expect(await recorded()).toBeNull();
  });

  it('records the facility entries then the global ones, once the first passes a login', async () => {
    await setEndpoints([A, B], SETTINGS_SCOPES.FACILITY, FACILITY_A);
    await setEndpoints([C], SETTINGS_SCOPES.GLOBAL);
    const selector = makeSelector({ working: new Set([A, B, C]) });

    expect(await apply(selector)).toEqual({ applied: true });

    expect(await recorded()).toEqual([A, B, C]);
    expect(selector.state.hosts).toEqual([A, B, C]);
    expect(selector.state.inUse).toBe(A);
    expect(selector.state.probed).toEqual([A]);
  });

  it('drops an endpoint already present at an earlier position, however it is spelled', async () => {
    await setEndpoints([A, 'https://B.example.com/'], SETTINGS_SCOPES.FACILITY, FACILITY_A);
    await setEndpoints([B, A, C], SETTINGS_SCOPES.GLOBAL);
    const selector = makeSelector({ working: new Set([A]) });

    await apply(selector);

    expect(await recorded()).toEqual([A, B, C]);
  });

  it('uses each hosted facility’s entries in turn, then the global ones', async () => {
    await setEndpoints([B], SETTINGS_SCOPES.FACILITY, FACILITY_B);
    await setEndpoints([A], SETTINGS_SCOPES.FACILITY, FACILITY_A);
    await setEndpoints([C], SETTINGS_SCOPES.GLOBAL);
    const selector = makeSelector({ working: new Set([A]) });

    await apply(selector, [FACILITY_A, FACILITY_B]);

    expect(await recorded()).toEqual([A, B, C]);
  });

  it('ignores another facility’s entries', async () => {
    await setEndpoints([B], SETTINGS_SCOPES.FACILITY, OTHER_FACILITY);
    await setEndpoints([A], SETTINGS_SCOPES.GLOBAL);
    const selector = makeSelector({ working: new Set([A]) });

    await apply(selector);

    expect(await recorded()).toEqual([A]);
  });

  it('stops at the first entry that passes, but records the whole list', async () => {
    await setEndpoints([A, B, C], SETTINGS_SCOPES.GLOBAL);
    const selector = makeSelector({ working: new Set([B, C]) });

    await apply(selector);

    expect(selector.state.probed).toEqual([A, B]);
    expect(selector.state.inUse).toBe(B);
    expect(await recorded()).toEqual([A, B, C]);
  });

  it('changes nothing when the list matches the recorded one', async () => {
    await setEndpoints([A, B], SETTINGS_SCOPES.GLOBAL);
    const selector = makeSelector({ hosts: [A, B], working: new Set([A, B]) });

    expect(await apply(selector)).toEqual({ applied: false, reason: 'unchanged' });

    expect(selector.state.probed).toEqual([]);
    expect(await recorded()).toBeNull();
  });

  it('applies a reordered list', async () => {
    await setEndpoints([B, A], SETTINGS_SCOPES.GLOBAL);
    const selector = makeSelector({ hosts: [A, B], working: new Set([B]) });

    expect(await apply(selector)).toEqual({ applied: true });

    expect(selector.state.hosts).toEqual([B, A]);
  });

  it('keeps the recorded list when no supplied entry passes, and logs it', async () => {
    await setEndpoints([A, B], SETTINGS_SCOPES.GLOBAL);
    const selector = makeSelector();

    expect(await apply(selector)).toEqual({ applied: false, reason: 'none-verified' });

    expect(selector.state.probed).toEqual([A, B]);
    expect(selector.state.hosts).toEqual([SEED]);
    expect(await recorded()).toBeNull();
  });

  it('tries the supplied list again on a later call', async () => {
    await setEndpoints([A], SETTINGS_SCOPES.GLOBAL);
    const working = new Set();
    const selector = makeSelector({ working });

    await apply(selector);
    expect(await recorded()).toBeNull();

    working.add(A);
    await apply(selector);
    expect(await recorded()).toEqual([A]);
  });

  it('drops invalid entries rather than failing the list', async () => {
    await setEndpoints(['not a url', 'http://public.example.com', A], SETTINGS_SCOPES.GLOBAL);
    const selector = makeSelector({ working: new Set([A]) });

    await apply(selector);

    expect(await recorded()).toEqual([A]);
  });

  describe('when SYNC_URL fixes the host', () => {
    beforeEach(async () => {
      process.env.SYNC_URL = 'https://user%40x.io:pw@env.example.com';
      await initServerConfig({ context: ctx });
    });

    afterEach(async () => {
      delete process.env.SYNC_URL;
      await initServerConfig({ context: ctx });
    });

    it('ignores central’s list', async () => {
      await setEndpoints([A], SETTINGS_SCOPES.GLOBAL);
      const selector = makeSelector({ hosts: ['https://env.example.com'], working: new Set([A]) });

      expect(await apply(selector)).toEqual({ applied: false, reason: 'not-applicable' });

      expect(selector.state.probed).toEqual([]);
      expect(await recorded()).toBeNull();
    });
  });

  it('does nothing without a selector', async () => {
    await setEndpoints([A], SETTINGS_SCOPES.GLOBAL);
    expect(await apply(null)).toEqual({ applied: false, reason: 'not-applicable' });
  });
});
