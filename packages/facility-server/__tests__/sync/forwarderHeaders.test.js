/**
 * Forwards to central carry the end-client IP plus the facility's own central
 * session as the forwarder credential — and degrade to IP-only (which central
 * ignores) when the facility can't authenticate.
 */
const { CentralServerConnection } = jest.requireActual('../../dist/sync/CentralServerConnection');

describe('forwarderHeaders', () => {
  const makeConnection = () => {
    const connection = new CentralServerConnection({ deviceId: 'facility-own-device' });
    connection.fetch = jest.fn(async () => ({ ok: 'ok' }));
    return connection;
  };
  const req = { method: 'POST', body: { mfaToken: 'x' }, ip: '10.1.2.3' };

  it('carries the client IP and the facility credential', async () => {
    const connection = makeConnection();
    connection.loginData = jest.fn(async () => ({}));
    connection.getAuthToken = jest.fn(() => 'facility-session-token');

    await connection.forwardRequest(req, 'mfa/login/totp');
    expect(connection.fetch).toHaveBeenCalledWith(
      'mfa/login/totp',
      expect.objectContaining({
        method: 'POST',
        body: { mfaToken: 'x' },
        headers: {
          'X-Tamanu-Client-Ip': '10.1.2.3',
          'X-Tamanu-Forwarder-Auth': 'facility-session-token',
        },
      }),
    );
  });

  it('degrades to IP-only when the facility cannot authenticate', async () => {
    const connection = makeConnection();
    connection.loginData = jest.fn(async () => {
      throw new Error('central unreachable');
    });

    await connection.forwardRequest(req, 'mfa/login/totp');
    expect(connection.fetch).toHaveBeenCalledWith(
      'mfa/login/totp',
      expect.objectContaining({
        headers: { 'X-Tamanu-Client-Ip': '10.1.2.3' },
      }),
    );
  });
});
