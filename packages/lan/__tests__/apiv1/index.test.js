
import { 
  getTestContext,
  extendExpect,
  deleteAllTestIds,
} from '../utilities';

const app = getTestContext();

extendExpect(expect);

beforeAll(async () => {
  await app.sequelize.sync();

  // delete them here too in case the afterAll didn't
  // run last time for whatever reason
  await deleteAllTestIds(app);
});

afterAll(async () => {
  // delete all test records in all tables
  await deleteAllTestIds(app);
});

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

describe('User', () => {

  describe('auth', () => {
    test.todo('should obtain a valid login token');
    test.todo('should refresh a token');
    test.todo('should not refresh an expired token');

    test.todo('should get the user based on the current token');

    test.todo('should fail to obtain a token for bad credentials');
  });

  it('should create a new user', async () => {
    const result = await app.post('/v1/user').send({
      displayName: 'Test New',
      email: 'test123@user.com',
      password: 'abc',
    });
    expect(result.body.id).not.toBeNull();
    expect(result.body.password).toBeUndefined();
  });

  it('should change a name', async () => {
    const baseResult = await app.post('/v1/user').send({
      displayName: 'Alan',
      email: 'email@user.com',
      password: '123',
    });
    expect(baseResult.body).toHaveProperty('id');
    expect(baseResult.body).toHaveProperty('displayName', 'Alan');
    const id = baseResult.body.id;
    
    const result = await app.put(`/v1/user/${id}`).send({
      displayName: 'Brian'
    });
    expect(result.body).toHaveProperty('displayName', 'Brian');
    const updatedUser = await app.models.User.findByPk(id);
    expect(updatedUser).toHaveProperty('displayName', 'Brian');
  });

  it('should change a password', async () => {
    const baseResult = await app.post('/v1/user').send({
      displayName: 'Alan',
      email: 'passwordy@user.com',
      password: '123',
    });
    expect(baseResult.body).toHaveProperty('id');
    const id = baseResult.body.id;
    const user = await app.models.User.findByPk(id);
    const oldpw = user.password;
    expect(oldpw).toBeTruthy();
    
    const result = await app.put(`/v1/user/${id}`).send({
      password: '999',
      displayName: 'Heffo',
    });
    expect(result.body).not.toHaveProperty('password');
    const updatedUser = await app.models.User.findByPk(id);
    expect(updatedUser).toHaveProperty('displayName', 'Heffo');
    expect(updatedUser.password).toBeTruthy();
    expect(updatedUser.password).not.toEqual('999');
    expect(updatedUser.password).not.toEqual(oldpw);
  });

  it('should fail to create a user without an email', async () => {
    const result = await app.post('/v1/user').send({ });
    expect(result).toHaveRequestError();
  });

  it('should fail to create a user with a duplicate email', async () => {
    const baseUserResult = await app.post('/v1/user').send({
      displayName: 'Test Dupe',
      email: 'duplicate@user.com',
      password: 'abc',
    });
    expect(baseUserResult.body.id).not.toBeNull();

    const result = await app.post('/v1/user').send({
      displayName: 'Test Dupe II',
      email: 'duplicate@user.com',
      password: 'abc',
    });
    expect(result).toHaveRequestError();
  });

});

describe('Patient', () => {
  test.todo('should reject users with insufficient permissions');
  test.todo('should create an access record');

  test.todo('should get a list of patients matching a filter');
  test.todo('should get the details of a patient');

  test.todo('should get a list of patient conditions');
  test.todo('should get a list of patient allergies');
  test.todo('should get a list of patient family history entries');
  test.todo('should get a list of patient issues');

  describe('write', () => {
    test.todo('should reject users with insufficient permissions');

    test.todo('should create a new patient');
    test.todo('should update patient details');

    test.todo('should create a new patient as a new birth');

    test.todo('should add a new condition');
    test.todo('should edit an existing condition');
    test.todo('should add a new allergy');
    test.todo('should edit an existing allergy');
    test.todo('should add a new family history entry');
    test.todo('should edit an existing family history entry');
    test.todo('should add a new issue');
    test.todo('should edit an existing issue');
  });

  describe('merge', () => {
    test.todo('should merge two patients into a single record');
  });

  describe('search', () => {
    test.todo('should get a patient by id');
    test.todo('should get a patient by displayId');

    test.todo('should get a list of patients by name');
    test.todo('should get a list of patients by age range');
    test.todo('should get a list of patients by village');
    test.todo('should get a list of patients by multiple factors');

    test.todo('should get a list of outpatients');
    test.todo('should get a list of inpatients sorted by department');
  });

  test.todo('should get a list of patient visits');
  test.todo('should get a list of patient appointments');
  test.todo('should get a list of patient referrals');
});

describe('Visit', () => {
  test.todo('should reject a user with insufficient permissions');
  test.todo('should create an access record');

  test.todo('should get a list of diagnoses');
  test.todo('should get a list of vitals readings');
  test.todo('should get a list of notes');
  test.todo('should get a list of procedures');
  test.todo('should get a list of lab requests');
  test.todo('should get a list of imaging requests');
  test.todo('should get a list of prescriptions');

  describe('write', () => {
    test.todo('should reject a user with insufficient permissions');

    describe('journey', () => {
      test.todo('should admit a patient');
      test.todo('should update visit details');
      test.todo('should change visit department');
      test.todo('should change visit location');
      test.todo('should discharge a patient');

      test.todo('should not admit a patient who is already in a visit');
      test.todo('should not admit a patient who is dead');
    });

    test.todo('should record a diagnosis');
    test.todo('should update a diagnosis');
    test.todo('should record a vitals reading');
    test.todo('should update a vitals reading');
    test.todo('should record a note');
    test.todo('should update a note');
  });
});

describe('Triage', () => {
  test.todo('should admit a patient to triage');
  test.todo('should close a triage by progressing a visit');
  test.todo('should close a triage by discharging');

  test.todo('should get a list of all triages with relevant attached data');
  test.todo('should filter triages by location');
  test.todo('should filter triages by age range');
  test.todo('should filter triages by chief complaint');
});

describe('Labs', () => {
  test.todo('should record a lab request');
  test.todo('should record a test result');
  test.todo('should record multiple test results');
  test.todo('should update the status of a lab test');
  test.todo('should update the status of a lab request');
  test.todo('should publish a lab request');
});

describe('Imaging', () => {
  test.todo('should record an imaging request');
  test.todo('should update an imaging request');
});

describe('Procedures', () => {
  test.todo('should record a procedure');
  test.todo('should update a procedure');
});

describe('Medication', () => {
  test.todo('should record a prescription');
  test.todo('should update a prescription');
  test.todo('should mark a prescription as dispensed');
});

describe('Scheduling', () => {
  test.todo('should schedule a new appointment');
  test.todo('should cancel an appointment');
  test.todo('should resolve an appointment by opening a visit');
  test.todo('should reschedule an appointment');

  test.todo('should fail to reschedule a closed appointment');

  describe('search', () => {
    test.todo('should get appointments for a date range');
    test.todo('should get appointments for a department');
    test.todo('should get appointments for a location');
    test.todo('should get appointments for a department and date range');
  });
});

describe('Death', () => {
  test.todo('should mark a patient as dead');
  test.todo('should not mark a dead patient as dead');
});

describe('Administration', () => {
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
