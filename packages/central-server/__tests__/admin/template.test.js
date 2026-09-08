import { afterAll, beforeAll, describe, expect, it } from 'vitest';
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

  // The admin panel reads a template, spreads it into the form, and sends the lot back,
  // so the body carries the id and audit timestamps. simplePut filters those out.
  it('Should accept the whole Template sent back when editing', async () => {
    const { Template } = models;

    const template = await Template.create({
      name: 'Sick note - round trip',
      type: TEMPLATE_TYPES.PATIENT_LETTER,
    });

    const result = await adminApp
      .put(`/api/admin/template/${template.id}`)
      .send({ ...template.forResponse(), body: 'Edited text' });

    expect(result).toHaveSucceeded();
    await template.reload();
    expect(template.body).toEqual('Edited text');
  });

  it('Should ignore a client-supplied createdAt', async () => {
    const { Template } = models;

    const created = await adminApp.post('/api/admin/template').send({
      name: 'Sick note - created at',
      type: TEMPLATE_TYPES.PATIENT_LETTER,
      createdAt: '2000-01-01 00:00:00',
    });
    expect(created).toHaveSucceeded();
    const createdTemplate = await Template.findByPk(created.body.id);
    expect(new Date(createdTemplate.createdAt).getFullYear()).toBeGreaterThan(2000);

    const edited = await adminApp.put(`/api/admin/template/${created.body.id}`).send({
      name: 'Sick note - created at',
      type: TEMPLATE_TYPES.PATIENT_LETTER,
      createdAt: '2000-01-01 00:00:00',
    });
    expect(edited).toHaveSucceeded();
    await createdTemplate.reload();
    expect(new Date(createdTemplate.createdAt).getFullYear()).toBeGreaterThan(2000);
  });

  // dateCreated is a real column deliberately left out of the route's editable list, so it
  // is the probe for whether filtering is applied here at all.
  it('Should ignore a field outside the editable list when editing', async () => {
    const { Template } = models;

    const template = await Template.create({
      name: 'Sick note - filtered field',
      type: TEMPLATE_TYPES.PATIENT_LETTER,
    });
    const { dateCreated } = template;

    const result = await adminApp.put(`/api/admin/template/${template.id}`).send({
      name: 'Sick note - filtered field',
      type: TEMPLATE_TYPES.PATIENT_LETTER,
      dateCreated: '1999-12-31',
    });

    expect(result).toHaveSucceeded();
    await template.reload();
    expect(template.dateCreated).toEqual(dateCreated);
  });

  it('Should refuse to create a Template whose id already exists', async () => {
    const created = await adminApp.post('/api/admin/template').send({
      name: 'Sick note - duplicate id',
      type: TEMPLATE_TYPES.PATIENT_LETTER,
    });
    expect(created).toHaveSucceeded();

    const duplicate = await adminApp.post('/api/admin/template').send({
      id: created.body.id,
      name: 'Sick note - duplicate id, second',
      type: TEMPLATE_TYPES.PATIENT_LETTER,
    });
    expect(duplicate).toHaveRequestError();
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

    expect(response).toHaveRequestError(409);
    expect(response.body).toMatchObject({
      error: {
        message: 'Template name must be unique',
        name: 'EditConflictError',
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
