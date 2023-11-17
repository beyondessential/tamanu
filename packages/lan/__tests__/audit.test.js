import { createTestContext } from './utilities';
import { fake } from '@tamanu/shared/test-helpers';
import { AuditLogItem } from '../app/middleware/auditLog';
import { createDummyPatient } from '@tamanu/shared/demoData/patients';

describe('Audit log', () => {
  let ctx = null;
  let app = null;
  let baseApp = null;
  let models = null;
  
  // log entries aren't persisted (yet), so use this array to track audit log entries
  // as they get resolved.
  const recentEntries = [];
  // this flushes the recent entries array as well, so that tests can use it without additional boilerplate
  const getRecentEntries = () => { 
    const c = [...recentEntries];
    recentEntries.length = 0; // erase the array
    return c;
  };

  beforeAll(async () => {
    jest.spyOn(AuditLogItem.prototype, 'resolve').mockImplementation(function() {
      recentEntries.push(this);
    });
    
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
  });
  afterAll(() => {
    ctx.close();
    jest.restoreAllMocks();
  });

  it('should leave an access record', async () => {
    const result = await app.post('/v1/allergy').send(fake(models.PatientAllergy));
    expect(result).toHaveSucceeded();
    expect(result.body.recordedDate).toBeTruthy();

    const [log] = getRecentEntries();
    expect(log).toHaveProperty('userId');
    expect(log.permissionChecks[0]).toMatchObject({ 
      noun: 'PatientAllergy',
      verb: 'create',
      objectId: undefined,
    });
  });

  it('should leave an access record with permission failure details', async () => {
    const result = await baseApp.post('/v1/allergy').send(fake(models.PatientAllergy));
    expect(result).toBeForbidden();

    const [log] = getRecentEntries();
    expect(log).toHaveProperty('userId');
    expect(log.permissionChecks[0]).toMatchObject({ 
      noun: 'PatientAllergy',
      verb: 'create',
      objectId: undefined,
    });
    expect(log.annotations).toMatchObject({
      forbiddenReason: 'Cannot perform action "create" on PatientAllergy.',
    });
  });

  it('should track multiple permission checks in a single request', async () => {
    const patient = await models.Patient.create(await createDummyPatient());

    const result = await app.put(`/v1/patient/${patient.id}`).send({
      firstName: 'test',
    });
    expect(result).toHaveSucceeded();

    const [log] = getRecentEntries();
    expect(log.permissionChecks[0]).toMatchObject({
      verb: 'read',
      noun: 'Patient',
      objectId: undefined,  // intentional; happens before looking up a particular patient
    });
    expect(log.permissionChecks[1]).toMatchObject({
      verb: 'write',
      noun: 'Patient',
      objectId: patient.id,
    });
  });

  it('should discard an audit log when appropriate', async () => {
    // we don't care about the result of this, we just need any endpoint that doesn't 
    // perform any permission checks - login is one of these
    await app.post('/v1/login').send({});

    const logs = getRecentEntries();
    expect(logs).toHaveLength(0);
  });
});
