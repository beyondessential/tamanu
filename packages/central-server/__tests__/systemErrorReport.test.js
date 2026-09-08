import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { COMMUNICATION_STATUSES } from '@tamanu/constants';
import { createTestContext } from './utilities';

describe('systemErrorReport', () => {
  let ctx;
  let baseApp;
  let emailService;
  let app;
  let user;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    emailService = ctx.emailService;
    app = await baseApp.asRole('practitioner');
    user = app.user;
  });

  afterAll(() => ctx.close());

  beforeEach(() => {
    emailService.sendEmail.mockClear();
  });

  const validBody = () => ({
    errors: [
      { timestamp: '2026-01-01T00:00:00.000Z', message: 'Something went wrong on the server.' },
    ],
    additionalInformation: 'It keeps happening after login',
    email: 'clinician@example.org',
    userId: user.id,
    recipients: ['support@bes.au'],
  });

  it('sends an email to the configured recipients', async () => {
    const response = await app.post('/api/systemErrorReport').send(validBody());

    expect(response).toHaveSucceeded();
    expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
    const email = emailService.sendEmail.mock.calls[0][0];
    expect(email.to).toBe('support@bes.au');
    expect(email.text).toContain(user.id);
    expect(email.text).toContain('clinician@example.org');
    expect(email.text).toContain('It keeps happening after login');
    expect(email.text).toContain('Something went wrong on the server.');
  });

  it('joins multiple recipients', async () => {
    const response = await app
      .post('/api/systemErrorReport')
      .send({ ...validBody(), recipients: ['support@bes.au', 'ops@bes.au'] });

    expect(response).toHaveSucceeded();
    expect(emailService.sendEmail.mock.calls[0][0].to).toBe('support@bes.au, ops@bes.au');
  });

  it('does not include the follow-up email in the body when not provided', async () => {
    const response = await app
      .post('/api/systemErrorReport')
      .send({ ...validBody(), email: undefined });

    expect(response).toHaveSucceeded();
    expect(emailService.sendEmail.mock.calls[0][0].text).toContain('(not provided)');
  });

  it('rejects a request with no errors', async () => {
    const response = await app
      .post('/api/systemErrorReport')
      .send({ ...validBody(), errors: [] });

    expect(response).toHaveRequestError();
    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });

  it('rejects a request with no recipients', async () => {
    const response = await app
      .post('/api/systemErrorReport')
      .send({ ...validBody(), recipients: [] });

    expect(response).toHaveRequestError();
    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });

  it('rejects an invalid follow-up email', async () => {
    const response = await app
      .post('/api/systemErrorReport')
      .send({ ...validBody(), email: 'not-an-email' });

    expect(response).toHaveRequestError();
    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });

  it('rejects an unauthenticated request', async () => {
    const response = await baseApp.post('/api/systemErrorReport').send(validBody());

    expect(response).not.toHaveSucceeded();
  });

  it('fails if the email cannot be sent', async () => {
    emailService.sendEmail.mockImplementationOnce(() =>
      Promise.resolve({ status: COMMUNICATION_STATUSES.ERROR, error: 'SMTP connection failed' }),
    );

    const response = await app.post('/api/systemErrorReport').send(validBody());

    expect(response).not.toHaveSucceeded();
  });
});
