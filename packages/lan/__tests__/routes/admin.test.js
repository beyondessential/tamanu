import supertest from 'supertest';
import shortid from 'shortid';

import { setupDatabase } from '../../app/database';
import { createApp } from '../../createApp';
import { clearTestData, generateTestId } from '../utilities';

jest.mock('shortid');

describe('admin routes', () => {
  const db = setupDatabase();
  const app = supertest(createApp(db));

  beforeAll(() => {
    shortid.generate.mockImplementation(generateTestId);
  });

  afterAll(() => {
    clearTestData(db);
    // clear stubbed shortid
    shortid.generate.mockClear();
  });

  it('should add a location', async () => {
    const name = 'Test Ward 1';
    await app.put('/admin/location').send([{ name }]);
    const results = db.objects('location').filtered('name = $0', name);
    expect(results.length).toEqual(1);
  });

  describe('adding a diagnosis', () => {
    const code = 'Test TB_1';

    it('should add a diagnosis', async () => {
      const name = 'Test Tuberculosis';
      const defaultType = 'icd10';
      await app.put('/admin/diagnosis').send([{ code, name }]);
      const results = db.objects('diagnosis').filtered('code = $0', code);
      expect(results.length).toEqual(1);
      const { name: storedName, type: storedType } = results[0];
      expect(storedName).toEqual(name);
      expect(storedType).toEqual(defaultType);
    });

    it('should update a diagnosis', async () => {
      const newName = 'Test TB';
      await app.put('/admin/diagnosis').send([{ code, name: newName }]);
      const results = db.objects('diagnosis').filtered('code = $0', code);
      expect(results.length).toEqual(1);
      expect(results[0].name).toEqual(newName);
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
