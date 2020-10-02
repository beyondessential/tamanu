import { createTestContext } from './utilities';

const { baseApp, store } = createTestContext();

describe("Basics", () => {
  it('should respond with an index page', async () => {
    const result = await baseApp.get('/');
    expect(result).toHaveSucceeded();
    expect(result.body).toHaveProperty('index', true);
  });

  it('should add an item', async () => {
    const item = await store.insert('test', {
      abc: '123',
    });
    expect(item).toHaveProperty('id');
    expect(item.id).toMatch(/^test-/);
    expect(item).toHaveProperty('abc', '123');
  });
});

describe("Auth", () => {
  it('should respond with a token', async () => {
    const result = await baseApp.get('/login?username=123&password=1234');
    expect(result).toHaveSucceeded();
    expect(result.body).toHaveProperty('token');
  });

  it('should reject with missing credentials', async () => {
    const result = await baseApp.get('/login');
    expect(result).toHaveRequestError();
  });

  test.todo('should reject with invalid credentials');
});
