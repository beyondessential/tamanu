import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SYSTEM_ERROR_RETENTION_MS, systemErrorStore } from '../../app/state/systemErrorStore';
import { clearSystemErrorsOnAuthChange } from '../../app/store/initStore';

const hoursAgo = hours => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

describe('systemErrorStore', () => {
  // The store is a module singleton, so reset it before each case.
  beforeEach(() => systemErrorStore.clear());

  it('appends an added error as unread', () => {
    systemErrorStore.add({ id: '1', timestamp: hoursAgo(0), message: 'boom' });

    expect(systemErrorStore.getSnapshot()).toEqual([
      { id: '1', timestamp: expect.any(String), message: 'boom', isRead: false },
    ]);
  });

  it('marks every error read', () => {
    systemErrorStore.add({ id: '1', timestamp: hoursAgo(0), message: 'a' });
    systemErrorStore.add({ id: '2', timestamp: hoursAgo(0), message: 'b' });

    systemErrorStore.markAllRead();

    expect(systemErrorStore.getSnapshot().every(error => error.isRead)).toBe(true);
  });

  it('removes errors by id', () => {
    systemErrorStore.add({ id: '1', timestamp: hoursAgo(0), message: 'a' });
    systemErrorStore.add({ id: '2', timestamp: hoursAgo(0), message: 'b' });

    systemErrorStore.remove(['1']);

    expect(systemErrorStore.getSnapshot().map(error => error.id)).toEqual(['2']);
  });

  it('purges errors older than the retention window, keeping fresher ones', () => {
    systemErrorStore.add({ id: 'fresh', timestamp: hoursAgo(1), message: 'fresh' });
    systemErrorStore.add({ id: 'stale', timestamp: hoursAgo(25), message: 'stale' });

    systemErrorStore.purgeStale();

    expect(systemErrorStore.getSnapshot().map(error => error.id)).toEqual(['fresh']);
  });

  it('retains an error right up to the retention boundary', () => {
    const now = Date.now();
    systemErrorStore.add({ id: 'edge', timestamp: hoursAgo(23.9), message: 'edge' });

    systemErrorStore.purgeStale(now);

    expect(systemErrorStore.getSnapshot()).toHaveLength(1);
    expect(SYSTEM_ERROR_RETENTION_MS).toBe(24 * 60 * 60 * 1000);
  });

  it('clears all errors', () => {
    systemErrorStore.add({ id: '1', timestamp: hoursAgo(0), message: 'a' });

    systemErrorStore.clear();

    expect(systemErrorStore.getSnapshot()).toEqual([]);
  });

  it('keeps a stable snapshot reference until the next mutation', () => {
    const before = systemErrorStore.getSnapshot();
    expect(systemErrorStore.getSnapshot()).toBe(before);

    systemErrorStore.add({ id: '1', timestamp: hoursAgo(0), message: 'a' });
    const after = systemErrorStore.getSnapshot();

    expect(after).not.toBe(before);
    expect(systemErrorStore.getSnapshot()).toBe(after);
  });

  it('notifies subscribers on mutation and stops after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = systemErrorStore.subscribe(listener);

    systemErrorStore.add({ id: '1', timestamp: hoursAgo(0), message: 'a' });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    systemErrorStore.add({ id: '2', timestamp: hoursAgo(0), message: 'b' });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('clearSystemErrorsOnAuthChange middleware', () => {
  beforeEach(() => systemErrorStore.clear());

  const seed = () => systemErrorStore.add({ id: '1', timestamp: hoursAgo(0), message: 'boom' });

  it('clears the store on LOGIN_SUCCESS, covering a fresh login and a restored session', () => {
    seed();
    const next = vi.fn(action => action);

    clearSystemErrorsOnAuthChange()(next)({ type: 'LOGIN_SUCCESS' });

    expect(systemErrorStore.getSnapshot()).toEqual([]);
    expect(next).toHaveBeenCalledWith({ type: 'LOGIN_SUCCESS' });
  });

  it('clears the store on LOGOUT', () => {
    seed();
    const next = vi.fn(action => action);

    clearSystemErrorsOnAuthChange()(next)({ type: 'LOGOUT' });

    expect(systemErrorStore.getSnapshot()).toEqual([]);
    expect(next).toHaveBeenCalledWith({ type: 'LOGOUT' });
  });

  it('leaves the store untouched for an unrelated action', () => {
    seed();
    const next = vi.fn(action => action);

    clearSystemErrorsOnAuthChange()(next)({ type: 'SOME_OTHER_ACTION' });

    expect(systemErrorStore.getSnapshot()).toHaveLength(1);
    expect(next).toHaveBeenCalledWith({ type: 'SOME_OTHER_ACTION' });
  });
});
