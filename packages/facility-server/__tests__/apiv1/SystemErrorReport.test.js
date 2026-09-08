import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CentralServerConnection } from '../../app/sync/CentralServerConnection';
import { createTestContext } from '../utilities';

describe('SystemErrorReport', () => {
  let ctx;
  let baseApp;
  let centralServer;
  let app;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    centralServer = ctx.centralServer;
    // The route constructs its own `new CentralServerConnection(...)`; force every such
    // call to return this same mock instance so assertions against it see the route's
    // actual calls (see User.test.js for the same pattern).
    CentralServerConnection.mockImplementation(function () {
      return centralServer;
    });
    app = await baseApp.asRole('practitioner');
  });

  afterAll(() => ctx.close());

  beforeEach(() => {
    centralServer.post.mockClear();
    centralServer.post.mockResolvedValue({ ok: 'ok' });
  });

  const validBody = () => ({
    errors: [{ timestamp: '2026-01-01T00:00:00.000Z', message: 'Something went wrong' }],
    additionalInformation: 'It keeps happening after login',
    email: 'clinician@example.org',
  });

  it('forwards the report to central with the resolved user id and default recipients', async () => {
    const response = await app.post('/api/systemErrorReport').send(validBody());

    expect(response).toHaveSucceeded();
    expect(centralServer.post).toHaveBeenCalledTimes(1);
    const [endpoint, forwardedBody] = centralServer.post.mock.calls[0];
    expect(endpoint).toBe('systemErrorReport');
    expect(forwardedBody).toMatchObject({
      ...validBody(),
      userId: app.user.id,
      recipients: ['support@bes.au'],
    });
  });

  it('does not forward any patient-identifiable information beyond the user id', async () => {
    await app.post('/api/systemErrorReport').send(validBody());

    const forwardedBody = centralServer.post.mock.calls[0][1];
    expect(forwardedBody.userId).toBe(app.user.id);
    expect(forwardedBody).not.toHaveProperty('displayName');
    expect(forwardedBody).not.toHaveProperty('userEmail');
  });

  it('rejects an unauthenticated request', async () => {
    const response = await baseApp.post('/api/systemErrorReport').send(validBody());

    expect(response).not.toHaveSucceeded();
    expect(centralServer.post).not.toHaveBeenCalled();
  });

  it('fails if central cannot send the email', async () => {
    centralServer.post.mockRejectedValueOnce(new Error('Email could not be sent'));

    const response = await app.post('/api/systemErrorReport').send(validBody());

    expect(response).not.toHaveSucceeded();
  });
});
