import { describe, expect, it } from 'vitest';
import { systemErrorsReducer } from '../../app/store/systemErrors';

const seededState = {
  errors: [{ id: '1', timestamp: new Date().toISOString(), message: 'boom', isRead: false }],
};

describe('systemErrorsReducer', () => {
  it('clears on LOGOUT', () => {
    const state = systemErrorsReducer(seededState, { type: 'LOGOUT' });

    expect(state.errors).toEqual([]);
  });

  it('clears on LOGIN_SUCCESS, covering both a fresh login and a restored session', () => {
    const state = systemErrorsReducer(seededState, { type: 'LOGIN_SUCCESS' });

    expect(state.errors).toEqual([]);
  });

  it('leaves state untouched for an unrelated action', () => {
    const state = systemErrorsReducer(seededState, { type: 'SOME_OTHER_ACTION' });

    expect(state).toBe(seededState);
  });
});
