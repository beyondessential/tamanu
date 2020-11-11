import { createTestContext } from './utilities';

const { baseApp, store } = createTestContext();

describe("Basics", () => {
  it('should respond with an index page', async () => {
    const result = await baseApp.get('/');
    expect(result).toHaveSucceeded();
    expect(result.body).toHaveProperty('index', true);
  });
});

describe("Auth", () => {
  it('should respond with a token', async () => {
    const result = await baseApp.get('/v1/login?username=123&password=1234');
    expect(result).toHaveSucceeded();
    expect(result.body).toHaveProperty('token');
  });

  it('should reject with missing credentials', async () => {
    const result = await baseApp.get('/v1/login');
    expect(result).toHaveRequestError();
  });

  test.todo('should reject with invalid credentials');
});
