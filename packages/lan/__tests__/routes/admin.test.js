import supertest from 'supertest';

import { setupDatabase } from '../../app/database';
import { createApp } from '../../createApp';
import { clearTestData, generateTestId } from '../utilities';

describe('admin routes', () => {
  const db = setupDatabase();
  const app = supertest(createApp(db));

  afterAll(() => {
    clearTestData(db);
  });

  it('should add a location', async () => {
    const id = generateTestId();
    const name = 'Test Ward 1';
    await app.put('/admin/location').send([{ _id: id, name }]);
    const results = db.objects('location').filtered('_id = $0', id);
    expect(results.length).toEqual(1);
    expect(results[0].name).toEqual('This should fail');
  });

  describe('adding a diagnosis', () => {
    const id = generateTestId();
    const code = 'Test TB_1';

    it('should add a diagnosis', async () => {
      const name = 'Test Tuberculosis';
      const defaultType = 'icd10';
      await app.put('/admin/diagnosis').send([{ _id: id, code, name }]);
      const results = db.objects('diagnosis').filtered('_id = $0', id);
      expect(results.length).toEqual(1);
      const { name: storedName, code: storedCode, type: storedType } = results[0];
      expect(storedName).toEqual(name);
      expect(storedCode).toEqual(code);
      expect(storedType).toEqual(defaultType);
    });

    it('should update a diagnosis', async () => {
      const newName = 'Test TB';
      await app.put('/admin/diagnosis').send([{ code, name: newName }]);
      const results = db.objects('diagnosis').filtered('_id = $0', id);
      expect(results.length).toEqual(1);
      const { name: storedName, code: storedCode } = results[0];
      expect(storedName).toEqual(newName);
      expect(storedCode).toEqual(code);
    });
  });

  describe('adding a user', () => {
    const id = generateTestId();

    it('should add a diagnosis', async () => {
      const name = 'Test Fred Hollows';
      await app.put('/admin/user').send([{ _id: id, name }]);
      const results = db.objects('user').filtered('_id = $0', id);
      expect(results.length).toEqual(1);
      expect(results[0].name).toEqual(name);
    });

    it('should update a diagnosis', async () => {
      const newName = 'Test Freddie Mercury';
      await app.put('/admin/user').send([{ _id: id, name: newName }]);
      const results = db.objects('user').filtered('_id = $0', id);
      expect(results.length).toEqual(1);
      expect(results[0].name).toEqual(newName);
    });
  });
});
