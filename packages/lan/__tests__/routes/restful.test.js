import supertest from 'supertest';
import shortid from 'shortid';

import { setupDatabase } from '../../app/database';
import { createApp } from '../../createApp';
import { clearTestData, generateTestId } from '../utilities';

jest.mock('shortid');

describe('restful routes', () => {
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
    await app.post('/location').send({ name });
    const results = db.objects('location').filtered('name = $0', name);
    expect(results.length).toEqual(1);
  });

  describe('adding a diagnosis', () => {
    const id = generateTestId();
    const code = 'Test TB_1';

    it('should add a diagnosis', async () => {
      const name = 'Test Tuberculosis';
      const defaultType = 'icd10';
      await app.post('/diagnosis').send({ _id: id, code, name });
      const results = db.objects('diagnosis').filtered('_id = $0', id);
      expect(results.length).toEqual(1);
      const { name: storedName, code: storedCode, type: storedType } = results[0];
      expect(storedName).toEqual(name);
      expect(storedCode).toEqual(code);
      expect(storedType).toEqual(defaultType);
    });

    it('should update a diagnosis', async () => {
      const newName = 'Test TB';
      await app.put(`/diagnosis/${id}`).send({ name: newName });
      const results = db.objects('diagnosis').filtered('_id = $0', id);
      expect(results.length).toEqual(1);
      const { name: storedName, code: storedCode } = results[0];
      expect(storedName).toEqual(newName);
      expect(storedCode).toEqual(code); // code shouldn't have changed
    });
  });

  describe('adding a user', () => {
    const id = generateTestId();

    it('should add a diagnosis', async () => {
      const name = 'Test Fred Hollows';
      await app.post('/user').send({ _id: id, name });
      const results = db.objects('user').filtered('_id = $0', id);
      expect(results.length).toEqual(1);
      expect(results[0].name).toEqual(name);
    });

    it('should update a diagnosis', async () => {
      const newName = 'Test Freddie Mercury';
      await app.put(`/user/${id}`).send({ name: newName });
      const results = db.objects('user').filtered('_id = $0', id);
      expect(results.length).toEqual(1);
      expect(results[0].name).toEqual(newName);
    });
  });

  xdescribe('patient journey', () => {
    
    it('should create a visit', async () => { }); 
    it('should change the department', async () => { }); 
    it('should plan a move', async () => { }); 
    it('should execute a move', async () => { }); 
    it('should fail to execute a move without planning it first', () => { }); 
    it('should cancel a planned move', async () => { }); 
    it('should fail to cancel a planned move if none exists', async () => { }); 
    it('should update the visit type', async () => { });

  });
});
