import { createTestContext } from '../utilities';

describe('Reference data', () => {
  let userApp = null;
  let adminApp = null;
  let baseApp = null;
  let models = null;

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    userApp = await baseApp.asRole('practitioner');
    adminApp = await baseApp.asRole('admin');
  });

  it('should not allow a regular user to create a new reference item', async () => {
    const result = await userApp.post('/v1/referenceData').send({
      type: 'icd10',
      name: 'fail',
      code: 'fail',
    });
    expect(result).toBeForbidden();
  });

  it('should not allow a regular user to alter existing reference data', async () => {
    const existing = await models.ReferenceData.create({
      type: 'icd10',
      name: 'no-user-change',
      code: 'no-user-change',
    });
    const result = await userApp.put(`/v1/referenceData/${existing.id}`).send({
      name: 'fail',
    });
    expect(result).toBeForbidden();
  });

  it('should allow an admin create a new reference data item', async () => {
    const result = await adminApp.post('/v1/referenceData').send({
      type: 'icd10',
      code: 'succeed',
      name: 'succeed',
    });
    expect(result).toHaveSucceeded();
  });

  it('should allow an admin to change a reference data label', async () => {
    const existing = await models.ReferenceData.create({
      type: 'icd10',
      name: 'change-label',
      code: 'change-label',
    });
    const result = await adminApp.put(`/v1/referenceData/${existing.id}`).send({
      name: 'succeed',
    });
    expect(result).toHaveSucceeded();
  });

  it('should not allow changing a reference data type', async () => {
    const existing = await models.ReferenceData.create({
      type: 'icd10',
      name: 'no-change-type',
      code: 'no-change-type',
    });
    const result = await adminApp.put(`/v1/referenceData/${existing.id}`).send({
      type: 'drug',
    });
    expect(result).toHaveRequestError();
  });

  it('should not allow creating a reference data with an invalid type', async () => {
    const result = await adminApp.post('/v1/referenceData').send({
      type: 'fail',
      name: 'test',
    });
    expect(result).toHaveRequestError();
  });
});
