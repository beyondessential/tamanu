import supertest from 'supertest';
import { subDays, subHours } from 'date-fns';

import { createTestContext } from './utilities';

const { baseApp, expressApp, store } = createTestContext();

const makeDate = (daysAgo, hoursAgo=0) => {
  return subHours(subDays(new Date(), daysAgo), hoursAgo).valueOf();
};

const OLDEST = makeDate(20);
const SECOND_OLDEST = makeDate(10);

const TEST_EMAIL = 'test@beyondessential.com.au';
const TEST_PASSWORD = '123123123';

const RECORDS = [
  { 
    lastSynced: OLDEST, 
    recordType: 'user',
    data: { email: TEST_EMAIL, password: TEST_PASSWORD } 
  },
];

describe.only("Auth", () => {

  let app = null;
  beforeAll(async () => {
    app = await baseApp.asRole('practitioner');

    await Promise.all(RECORDS.map(r => store.insert('user', {
      recordType: 'user',
      ...r,
    })));
  });

  it('Should get a token for correct credentials', async () => {
    const response = await baseApp.post('/login').send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(response).toHaveSucceeded();
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user.id');
    expect(response.body).toHaveProperty('user.email', TEST_EMAIL);
    expect(response.body).toHaveProperty('user.displayName');
    expect(response.body).not.toHaveProperty('user.password');
  });

  it('Should reject an empty credential', async () => {
    const response = await baseApp.post('/login').send({
      email: TEST_EMAIL,
      password: '',
    });
    expect(response).toHaveRequestError();
  });

  it('Should reject an incorrect password', async () => {
    const response = await baseApp.post('/login').send({
      email: TEST_EMAIL,
      password: 'not the password',
    });
    expect(response).toHaveRequestError();
  });

  it('Should answer a whoami request correctly', async () => {
    const response = await baseApp.post('/login').send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(response).toHaveSucceeded();
    const { token } = response.body;
    const agent = supertest.agent(expressApp);
    agent.set('authorization', `Bearer ${token}`);

    const whoamiResponse = await agent.get('/whoami');
    expect(whoamiResponse).toHaveSucceeded();
    expect(whoamiResponse.body).toHaveProperty('email', TEST_EMAIL);
    
  });

});

