import { createTestContext } from './utilities';

const { baseApp, store } = createTestContext();

describe("Basics", () => {
  it('should respond with an index page', async () => {
    const result = await baseApp.get('/');
    expect(result).toHaveSucceeded();
    expect(result.body).toHaveProperty('index', true);
  });
});

