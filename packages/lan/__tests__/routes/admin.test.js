import supertest from 'supertest';

import { setupDatabase } from '../../app/database';
import { createApp } from '../../createApp';
import { clearTestData, generateTestId } from '../utilities';

describe('admin routes', () => {
  const db = setupDatabase();
  const app = supertest(createApp(db));
  it('should add a location', async () => {
    const id = generateTestId();
    const name = 'Test Ward 1';
    await app.put('/admin/location').send([{ _id: id, name }]);
    const results = db.objects('location').filtered('_id = $0', id);
    expect(results.length).toEqual(1);
    expect(results[0].name).toEqual(name);
  });

  afterAll(() => {
    clearTestData(db);
  });
});
