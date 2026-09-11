import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { COMMUNICATION_STATUSES, SETTINGS_SCOPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from './utilities';

describe('systemErrorReport', () => {
  let ctx;
  let baseApp;
  let emailService;
  let models;
  let app;
  let user;
  let facility;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    emailService = ctx.emailService;
    models = ctx.store.models;
    app = await baseApp.asRole('practitioner');
    user = app.user;

    await models.Setting.set('auth.restrictUsersToFacilities', true);

    facility = await models.Facility.create(fake(models.Facility));
    await models.UserFacility.create({ facilityId: facility.id, userId: user.id });
    await user.reload({ include: 'facilities' });

    await models.Setting.set(
      'systemErrorReport.recipients',
      ['support@bes.au'],
      SETTINGS_SCOPES.FACILITY,
      facility.id,
    );
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
    facilityId: facility.id,
  });

  it('sends an email to the recipients configured for the facility', async () => {
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

  it('joins multiple recipients configured for the facility', async () => {
    await models.Setting.set(
      'systemErrorReport.recipients',
      ['support@bes.au', 'ops@bes.au'],
      SETTINGS_SCOPES.FACILITY,
      facility.id,
    );

    const response = await app.post('/api/systemErrorReport').send(validBody());

    expect(response).toHaveSucceeded();
    expect(emailService.sendEmail.mock.calls[0][0].to).toBe('support@bes.au, ops@bes.au');

    await models.Setting.set(
      'systemErrorReport.recipients',
      ['support@bes.au'],
      SETTINGS_SCOPES.FACILITY,
      facility.id,
    );
  });

  it('ignores a client-supplied recipients list and uses the facility setting instead', async () => {
    const response = await app
      .post('/api/systemErrorReport')
      .send({ ...validBody(), recipients: ['attacker@example.org'] });

    expect(response).toHaveSucceeded();
    expect(emailService.sendEmail.mock.calls[0][0].to).toBe('support@bes.au');
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

  it('rejects a request with no facilityId', async () => {
    const response = await app
      .post('/api/systemErrorReport')
      .send({ ...validBody(), facilityId: undefined });

    expect(response).toHaveRequestError();
    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });

  it('rejects a request for a facility the user does not have access to', async () => {
    const otherFacility = await models.Facility.create(fake(models.Facility));

    const response = await app
      .post('/api/systemErrorReport')
      .send({ ...validBody(), facilityId: otherFacility.id });

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
