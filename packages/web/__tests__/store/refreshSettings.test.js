import { describe, expect, it, vi } from 'vitest';

import { refreshSettings } from '../../app/store/auth';

const user = { id: 'user-1' };
const settings = { telemetry: { enabled: true } };

// Runs the thunk against a redux state whose auth slice can change while the
// settings request is in flight.
const runRefresh = async ({ authAtStart, authOnResponse = authAtStart }) => {
  let auth = authAtStart;
  const api = {
    fetchFrontEndSettings: vi.fn(async () => {
      auth = authOnResponse;
      return settings;
    }),
    persistSettings: vi.fn(),
  };
  const dispatch = vi.fn();
  await refreshSettings()(dispatch, () => ({ auth }), { api });
  return { api, dispatch };
};

describe('refreshSettings', () => {
  it('re-reads the settings of an admin panel session, which has no facility', async () => {
    const { api, dispatch } = await runRefresh({ authAtStart: { user, facilityId: null } });

    expect(api.fetchFrontEndSettings).toHaveBeenCalledWith(null);
    expect(api.persistSettings).toHaveBeenCalledWith(settings);
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_SETTINGS', settings });
  });

  it("re-reads the selected facility's settings", async () => {
    const { api } = await runRefresh({ authAtStart: { user, facilityId: 'facility-1' } });

    expect(api.fetchFrontEndSettings).toHaveBeenCalledWith('facility-1');
    expect(api.persistSettings).toHaveBeenCalledWith(settings);
  });

  it('drops the response when the user logs out while it is in flight', async () => {
    const { api, dispatch } = await runRefresh({
      authAtStart: { user, facilityId: null },
      authOnResponse: { user: null, facilityId: null },
    });

    expect(api.persistSettings).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('drops the response when the facility changes while it is in flight', async () => {
    const { api, dispatch } = await runRefresh({
      authAtStart: { user, facilityId: 'facility-1' },
      authOnResponse: { user, facilityId: 'facility-2' },
    });

    expect(api.persistSettings).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });
});
