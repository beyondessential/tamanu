import supertest from 'supertest';

import { setupDatabase } from '../../app/database';
import { createApp } from '../../createApp';

describe('admin routes', () => {
  const db = setupDatabase();
  const app = supertest(createApp(db));
  it('should add a location', async () => {
    await app.put('/admin/location').send({ name: 'Ward 1' });
    const results = db.objects('location').filtered('name = "Ward 1"');
    expect(results.length).toEqual(1);
    expect(results[0].name).toEqual('Ward 1');
  });
});
