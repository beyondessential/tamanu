import { createTestContext } from './utilities';

describe('Basics', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });

  afterAll(() => ctx.close());

  it('should respond with an index page', async () => {
    const result = await ctx.baseApp.get('/');
    expect(result).toHaveSucceeded();
    expect(result.body).toHaveProperty('index', true);
  });
});
