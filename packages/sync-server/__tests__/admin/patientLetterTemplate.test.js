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

  it('Should create a PatientLetterTemplate', async () => {
    const { PatientLetterTemplate } = models;

    const result = await adminApp.post('/v1/admin/patientLetterTemplate').send({
      name: 'Sick note (1)',
    });
    expect(result).toHaveSucceeded();

    const createdTemplate = await PatientLetterTemplate.findByPk(result.body.id);
    expect(createdTemplate.name).toEqual('Sick note (1)');
  });

  it('Should change a PatientLetterTemplate', async () => {
    const { PatientLetterTemplate } = models;

    const patientLetterTemplate = await PatientLetterTemplate.create({
      name: 'Sick note (2)',
    });

    const result = await adminApp.put(`/v1/admin/patientLetterTemplate/${patientLetterTemplate.id}`).send({
      name: 'Sick note (2)',
      body: 'Now we have some text',
    });

    expect(result).toHaveSucceeded();

    const createdTemplate = await PatientLetterTemplate.findByPk(result.body.id);
    expect(createdTemplate.name).toEqual('Sick note (2)');
    expect(createdTemplate.body).toEqual('Now we have some text');
  });

  it('Should require a unique name when editing a PatientLetterTemplate', async () => {
    const { PatientLetterTemplate } = models;

    await PatientLetterTemplate.create({
      name: 'Sick note - name should conflict',
    });
    const patientLetterTemplate = await PatientLetterTemplate.create({
      name: 'Sick note (3)',
    });

    const response = await adminApp.put(`/v1/admin/patientLetterTemplate/${patientLetterTemplate.id}`).send({
      name: 'Sick note - name should conflict',
      body: 'Now we have some text',
    });

    expect(response).toHaveRequestError(422);
    expect(response.body).toMatchObject({
      error: {
        message: 'Template name must be unique',
        name: 'SequelizeValidationError',
      },
    });
  });

  it('Should require a unique name when creating a PatientLetterTemplate', async () => {
    const { PatientLetterTemplate } = models;
    await PatientLetterTemplate.create({
      name: 'Sick note - name should conflict',
    });

    const response = await adminApp.post('/v1/admin/patientLetterTemplate').send({
      name: 'Sick note - name should conflict',
    });
    expect(response).toHaveRequestError(422);
    expect(response.body).toMatchObject({
      error: {
        message: 'Template name must be unique',
        name: 'SequelizeValidationError',
      },
    });
  });
});
