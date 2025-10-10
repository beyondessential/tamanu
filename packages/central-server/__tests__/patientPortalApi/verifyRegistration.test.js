import {
  PORTAL_ONE_TIME_TOKEN_TYPES,
  PORTAL_USER_STATUSES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { PortalOneTimeTokenService } from '../../app/patientPortalApi/auth/PortalOneTimeTokenService';

const TEST_PATIENT_EMAIL = 'register@test.com';
const REGISTRATION_URL = '/api/portal/verify-registration';

describe('Patient Portal Registration Verification Endpoint', () => {
  let baseApp;
  let store;
  let close;
  let testPatient;
  let testPortalUser;
  let testVillage;
  let oneTimeTokenService;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    store = ctx.store;
    const { Patient, PortalUser, ReferenceData, Setting } = store.models;

    await Setting.set('features.patientPortal', true);

    // Create a test village
    testVillage = await ReferenceData.create(
      fake(ReferenceData, {
        type: 'village',
        name: 'Test Village',
        code: 'TEST001',
      }),
    );

    // Create a test patient
    testPatient = await Patient.create(
      fake(Patient, {
        displayId: 'TEST001',
        firstName: 'John',
        lastName: 'Doe',
        sex: 'male',
        villageId: testVillage.id,
      }),
    );

    // Create a test portal user with UNREGISTERED status
    testPortalUser = await PortalUser.create({
      email: TEST_PATIENT_EMAIL,
      patientId: testPatient.id,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      status: PORTAL_USER_STATUSES.UNREGISTERED,
    });

    // Initialize token service
    oneTimeTokenService = new PortalOneTimeTokenService(store.models);
  });

  afterAll(async () => close());

  it('Should successfully verify registration with valid token', async () => {
    // Create a registration token
    const { token } = await oneTimeTokenService.createRegisterToken(testPortalUser.id);
    const fullToken = `${testPortalUser.id}.${token}`;

    const response = await baseApp.post(REGISTRATION_URL).send({ token: fullToken });

    expect(response).toHaveSucceeded();
    expect(response.body).toHaveProperty('message', 'User registered successfully');

    // Verify user status was updated
    const updatedUser = await store.models.PortalUser.findByPk(testPortalUser.id);
    expect(updatedUser.status).toEqual(PORTAL_USER_STATUSES.REGISTERED);

    // Token should be consumed
    const tokenRecord = await store.models.PortalOneTimeToken.findOne({
      where: {
        portalUserId: testPortalUser.id,
        type: PORTAL_ONE_TIME_TOKEN_TYPES.REGISTER,
      },
    });
    expect(tokenRecord).toBeNull();
  });

  it('Should return successfully if already registered', async () => {
    // Create a new portal user that is already registered
    const alreadyRegisteredUser = await store.models.PortalUser.create({
      email: 'already-registered@test.com',
      patientId: testPatient.id,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      status: PORTAL_USER_STATUSES.REGISTERED,
    });

    // Create a registration token
    const { token } = await oneTimeTokenService.createRegisterToken(alreadyRegisteredUser.id);
    const fullToken = `${alreadyRegisteredUser.id}.${token}`;

    const response = await baseApp.post(REGISTRATION_URL).send({ token: fullToken });

    expect(response).toHaveSucceeded();
    expect(response.body).toHaveProperty('message', 'User already registered');
  });

  it('Should reject registration with invalid token format', async () => {
    const response = await baseApp.post(REGISTRATION_URL).send({ token: 'invalid-token' });

    expect(response).toHaveRequestError();
    expect(response.body).toHaveProperty('error');
    expect(response.body.error.status).toEqual(401);
    expect(response.body.error.message).toEqual('Invalid registration token');
  });

  it('Should reject registration with non-existent user id', async () => {
    // Create a token with non-existent user ID
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const response = await baseApp
      .post(REGISTRATION_URL)
      .send({ token: `${nonExistentId}.sometoken` });

    expect(response).toHaveRequestError();
    expect(response.body).toHaveProperty('error');
    expect(response.body.error.status).toEqual(401);
    expect(response.body.error.message).toEqual('Invalid registration token');
  });

  it('Should reject registration with empty token', async () => {
    const response = await baseApp.post(REGISTRATION_URL).send({ token: '' });

    expect(response).toHaveRequestError();
    expect(response.body).toHaveProperty('error');
    expect(response.body.error.status).toEqual(401);
    expect(response.body.error.message).toEqual('No registration token provided');
  });

  it('Should reject registration with expired token', async () => {
    // Create a test portal user
    const tempUser = await store.models.PortalUser.create({
      email: 'expired-token@test.com',
      patientId: testPatient.id,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      status: PORTAL_USER_STATUSES.UNREGISTERED,
    });

    // Create a registration token
    const { token } = await oneTimeTokenService.createRegisterToken(tempUser.id);
    const fullToken = `${tempUser.id}.${token}`;

    // Manually expire the token
    await store.models.PortalOneTimeToken.update(
      { expiresAt: new Date(Date.now() - 10000) }, // Set expiry to the past
      {
        where: {
          portalUserId: tempUser.id,
          type: PORTAL_ONE_TIME_TOKEN_TYPES.REGISTER,
        },
      },
    );

    const response = await baseApp.post(REGISTRATION_URL).send({ token: fullToken });

    expect(response).toHaveRequestError();
    expect(response.body).toHaveProperty('error');
    expect(response.body.error.status).toEqual(401);
    expect(response.body.error.message).toEqual('Verification code has expired');
  });
});
