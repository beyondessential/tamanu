import { describe, expect, it, vi } from 'vitest';
import { DEVICE_SCOPES } from '@tamanu/constants';

const login = vi.fn();

// The probe talks to a remote central, so the request it makes is the only
// observable behaviour here.
vi.mock('@tamanu/api-client', () => ({
  TamanuApi: class {
    login = login;
  },
}));

vi.mock('../../app/serverConfig', async importOriginal => ({
  ...(await importOriginal()),
  isServerConfigured: () => false,
}));

const { setupSyncHandler } = await import('../../app/routes/apiv1/setup');

const EMAIL = 'admin@example.com';
const PASSWORD = 'sup3r-secret-pw';

// The device the wizard registers on central is the one the sync process later
// logs in with. Central pins a device's scopes at first registration and refuses
// a later login asking for more, so the probe has to claim the scope sync needs.
describe('setup wizard credential probe', () => {
  it('asks central for the sync_client device scope', async () => {
    login.mockRejectedValue(new Error('central says no'));

    const req = {
      flagPermissionChecked: () => {},
      ip: '127.0.0.1',
      deviceId: 'facility-probe',
      body: {
        host: 'https://central.example.com',
        email: EMAIL,
        password: PASSWORD,
        facilityIds: ['facility-a'],
      },
    };
    const res = {
      status() {
        return this;
      },
      send() {
        return this;
      },
    };

    await setupSyncHandler(req, res, error => {
      throw error;
    });

    expect(login).toHaveBeenCalledWith(
      EMAIL,
      PASSWORD,
      expect.objectContaining({ scopes: [DEVICE_SCOPES.SYNC_CLIENT] }),
    );
  });
});
