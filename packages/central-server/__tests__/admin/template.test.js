import { TEMPLATE_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { createTestContext } from '../utilities';

describe('Patient merge', () => {
  let ctx;
  let models;
  let baseApp;
  let adminApp;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    adminApp = await baseApp.asRole('admin');
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('Should create a Template', async () => {
    const { Template } = models;

    const result = await adminApp.post('/api/admin/template').send({
      name: 'Sick note (1)',
      type: TEMPLATE_TYPES.PATIENT_LETTER,
    });
    expect(result).toHaveSucceeded();

    const createdTemplate = await Template.findByPk(result.body.id);
    expect(createdTemplate.name).toEqual('Sick note (1)');
  });

  it('Should change a Template', async () => {
    const { Template } = models;

    const template = await Template.create({
      name: 'Sick note (2)',
      type: TEMPLATE_TYPES.PATIENT_LETTER,
    });

    const result = await adminApp.put(`/api/admin/template/${template.id}`).send({
      name: 'Sick note (2)',
      body: 'Now we have some text',
      type: TEMPLATE_TYPES.PATIENT_LETTER,
    });

    expect(result).toHaveSucceeded();

    const createdTemplate = await Template.findByPk(result.body.id);
    expect(createdTemplate.name).toEqual('Sick note (2)');
    expect(createdTemplate.body).toEqual('Now we have some text');
  });

  it('Should require a unique name when editing a Template', async () => {
    const { Template } = models;

    await Template.create({
      name: 'Sick note - name should conflict',
      type: TEMPLATE_TYPES.PATIENT_LETTER,
    });
    const template = await Template.create({
      name: 'Sick note (3)',
      type: TEMPLATE_TYPES.PATIENT_LETTER,
    });

    const response = await adminApp.put(`/api/admin/template/${template.id}`).send({
      name: 'Sick note - name should conflict',
      body: 'Now we have some text',
      type: TEMPLATE_TYPES.PATIENT_LETTER,
    });

    expect(response).toHaveRequestError(422);
    expect(response.body).toMatchObject({
      error: {
        message: 'Template name must be unique',
        name: 'DatabaseValidationError',
      },
    });
  });

  it('Should require a unique name when creating a Template', async () => {
    const { Template } = models;
    await Template.create({
      name: 'Sick note - name should conflict',
      type: TEMPLATE_TYPES.PATIENT_LETTER,
    });

    const response = await adminApp.post('/api/admin/template').send({
      name: 'Sick note - name should conflict',
      type: TEMPLATE_TYPES.PATIENT_LETTER,
    });
    expect(response).toHaveRequestError(409);
    expect(response.body).toMatchObject({
      error: {
        message: 'Template name must be unique',
        name: 'EditConflictError',
      },
    });
  });

  it('Should allow reusing a name from a historical Template', async () => {
    const { Template } = models;
    const name = 'Sick note - reused after delete';

    await Template.create({
      name,
      type: TEMPLATE_TYPES.PATIENT_LETTER,
      visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
    });

    const response = await adminApp.post('/api/admin/template').send({
      name,
      type: TEMPLATE_TYPES.PATIENT_LETTER,
    });
    expect(response).toHaveSucceeded();

    const createdTemplate = await Template.findByPk(response.body.id);
    expect(createdTemplate.name).toEqual(name);
    expect(createdTemplate.visibilityStatus).toEqual(VISIBILITY_STATUSES.CURRENT);
  });
});
