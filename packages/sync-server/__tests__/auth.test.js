import supertest from 'supertest';
import { subDays, subHours } from 'date-fns';
import bcrypt from 'bcrypt';

import { createTestContext } from './utilities';

const { baseApp, expressApp, store } = createTestContext();

const makeDate = (daysAgo, hoursAgo=0) => {
  return subHours(subDays(new Date(), daysAgo), hoursAgo).valueOf();
};

const OLDEST = makeDate(20);
const SECOND_OLDEST = makeDate(10);

const TEST_EMAIL = 'test@beyondessential.com.au';
const TEST_PASSWORD = '1Q2Q3Q4Q';

const RECORDS = [
  { 
    lastSynced: OLDEST, 
    recordType: 'user',
    data: { 
      email: TEST_EMAIL, 
      password: TEST_PASSWORD, 
      displayName: 'Test Beyond' 
    } 
  },
];

describe.only("Auth", () => {

  let app = null;
  beforeAll(async () => {
    app = await baseApp.asRole('practitioner');

    await Promise.all(RECORDS.map(async r => {
      // TODO: should happen through a store.updateUser function
      const password = r.data.password;
      delete r.data.password;
      r.data.hashedPassword = await bcrypt.hash(password, 10);
      return store.insert('user', {
        recordType: 'user',
        ...r,
      });
    }));
  });

  it('Should get a token for correct credentials', async () => {
    const response = await baseApp.post('/v1/login').send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(response).toHaveSucceeded();
    expect(response.body).toHaveProperty('token');
  });

  it('Should respond with user details with correct credentials', async () => {
    const response = await baseApp.post('/v1/login').send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(response).toHaveSucceeded();
    expect(response.body).toHaveProperty('user.id');
    expect(response.body).toHaveProperty('user.email', TEST_EMAIL);
    expect(response.body).toHaveProperty('user.displayName');

    expect(response.body).not.toHaveProperty('user.password');
    expect(response.body).not.toHaveProperty('user.hashedPassword');
  });

  it('Should reject an empty credential', async () => {
    const response = await baseApp.post('/v1/login').send({
      email: TEST_EMAIL,
      password: '',
    });
    expect(response).toHaveRequestError();
  });

  it('Should reject an incorrect password', async () => {
    const response = await baseApp.post('/v1/login').send({
      email: TEST_EMAIL,
      password: 'not the password',
    });
    expect(response).toHaveRequestError();
  });

  it('Should answer a whoami request correctly', async () => {
    // first, log in and get token
    const response = await baseApp.post('/v1/login').send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(response).toHaveSucceeded();
    const { token } = response.body;

    // then run the whoami request
    const agent = supertest.agent(expressApp);
    agent.set('authorization', `Bearer ${token}`);

    const whoamiResponse = await agent.get('/v1/whoami');
    expect(whoamiResponse).toHaveSucceeded();

    const { body } = whoamiResponse;
    expect(body).toHaveProperty('email', TEST_EMAIL);
    expect(body).not.toHaveProperty('password');
    expect(body).not.toHaveProperty('hashedPassword');
  });

});

