import { createTestContext } from '../utilities';

const { baseApp } = createTestContext();

describe('fundamentals', () => {
  test.todo('should respond to a GET request');
  test.todo('should respond to a POST request');

  it('should 404 an invalid GET route', async () => {
    const result = await baseApp.get('/invalid');
    expect(result.statusCode).toEqual(404);
  });

  it('should 404 an invalid POST route', async () => {
    const result = await baseApp.post('/invalid');
    expect(result.statusCode).toEqual(404);
  });
});

