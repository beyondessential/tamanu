import { describe, expect, it } from 'vitest';
import { TamanuApi } from '../src/TamanuApi';

const makeApi = () =>
  new TamanuApi({
    endpoint: 'http://localhost/api',
    agentName: 'test',
    agentVersion: '0.0.0',
    deviceId: 'device-1',
  });

const alice = { id: 'alice', email: 'alice@example.com', displayName: 'Alice' };
const bob = { id: 'bob', email: 'bob@example.com', displayName: 'Bob' };

describe('TamanuApi.setUser', () => {
  it('has no user or sign-in before anyone signs in', () => {
    const api = makeApi();
    expect(api.user).toBeNull();
    expect(api.signInId).toBeNull();
  });

  it('mints a sign-in id when a user signs in', () => {
    const api = makeApi();
    api.setUser(alice);
    expect(api.user).toBe(alice);
    expect(api.signInId).toMatch(/^[0-9a-f]{32}$/);
  });

  it('keeps the sign-in id when the same user is fetched again', () => {
    const api = makeApi();
    api.setUser(alice);
    const { signInId } = api;
    api.setUser({ ...alice });
    expect(api.signInId).toBe(signInId);
  });

  it('clears the user and sign-in on sign-out', () => {
    const api = makeApi();
    api.setUser(alice);
    api.setUser(null);
    expect(api.user).toBeNull();
    expect(api.signInId).toBeNull();
  });

  it('mints a new sign-in id when the same user signs in again', () => {
    const api = makeApi();
    api.setUser(alice);
    const first = api.signInId;
    api.setUser(null);
    api.setUser(alice);
    expect(api.signInId).not.toBeNull();
    expect(api.signInId).not.toBe(first);
  });

  it('mints a new sign-in id when a different user replaces the current one', () => {
    const api = makeApi();
    api.setUser(alice);
    const first = api.signInId;
    api.setUser(bob);
    expect(api.signInId).not.toBe(first);
  });
});
