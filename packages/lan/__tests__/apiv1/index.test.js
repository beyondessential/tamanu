
import { getTestContext } from '../utilities';

const app = getTestContext();

describe('fundamentals', () => {
  test.todo('should respond to a GET request');
  test.todo('should respond to a POST request');

  it('should 404 an invalid GET route', async () => {
    const result = await app.get('/invalid');
    expect(result.statusCode).toEqual(404);
  });

  it('should 404 an invalid POST route', async () => {
    const result = await app.post('/invalid');
    expect(result.statusCode).toEqual(404);
  });
});

describe('administration', () => {
  test.todo('should get a list of possible diagnoses');
  test.todo('should get a list of locations');
  test.todo('should get a list of departments');

  describe('write', () => {
    test.todo('should add a new diagnosis');
    test.todo('should rename a diagnosis');
    test.todo('should update a diagnosis code');
    test.todo('should add a new department');
    test.todo('should add a new location');
    test.todo('should rename a department');
    test.todo('should rename a location');
  });
});
