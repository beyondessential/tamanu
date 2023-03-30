import { Op } from 'sequelize';

import { showError } from 'shared/test-helpers';

import { createTestContext } from '../../utilities';

const INTEGRATION_ROUTE = 'fhir/mat';

describe(`Materialised FHIR - WriteLog`, () => {
  let ctx;
  let app;

  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  beforeEach(async () => {
    const { FhirWriteLog } = ctx.store.models;
    await FhirWriteLog.destroy({ where: {} });
  });

  it('logs a request for a non-existent resource', () =>
    showError(async () => {
      const { FhirWriteLog } = ctx.store.models;

      // act
      const body = {
        resourceType: 'FooBarBaz',
        status: 'final',
        nope: [
          {
            system: 'http://example.com',
            value: 'ACCESSION',
          },
        ],
        burger: [
          {
            type: 'ServiceRequest',
            identifier: {
              system: 'http://example.com',
              value: '123',
            },
          },
        ],
      };
      const response = await app.post(`/v1/integration/${INTEGRATION_ROUTE}/FooBarBaz`).send(body);

      // assert
      expect(response.status).not.toBe(201);
      const flog = await FhirWriteLog.findOne({
        where: { url: { [Op.like]: '%FooBarBaz%' } },
      });
      expect(flog).toBeTruthy();
      expect(flog.verb).toEqual('POST');
      expect(flog.body).toMatchObject(body);
    }));

  it('logs a request for a malformed resource', () =>
    showError(async () => {
      const { FhirWriteLog } = ctx.store.models;

      // act
      const body = {
        resourceType: 'NotTheSame',
        status: 'final',
        nope: [
          {
            system: 'http://example.com',
            value: 'ACCESSION',
          },
        ],
        burger: [
          {
            type: 'ServiceRequest',
            identifier: {
              system: 'http://example.com',
              value: '123',
            },
          },
        ],
      };
      const response = await app.post(`/v1/integration/${INTEGRATION_ROUTE}/FooBarBaz`).send(body);

      // assert
      expect(response.status).not.toBe(201);
      const flog = await FhirWriteLog.findOne({
        where: { url: { [Op.like]: '%FooBarBaz%' } },
      });
      expect(flog).toBeTruthy();
      expect(flog.verb).toEqual('POST');
      expect(flog.body).toMatchObject(body);
    }));

  it('logs the headers', () =>
    showError(async () => {
      const { FhirWriteLog } = ctx.store.models;

      // act
      const body = {
        resourceType: 'HeadMeOff',
        at: 'the pass',
      };
      const response = await app
        .post(`/v1/integration/${INTEGRATION_ROUTE}/HeadMeOff`)
        .set('X-Forwarded-For', '123.45.67.89')
        .set('Authorization', 'lmao')
        .set('X-Tamanu-Version', '1.23.4')
        .set('If-Match', 'is met')
        .set('Prefer', 'pretty')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/fhir+json; fhirVersion=4.0')
        .send(body);

      // assert
      expect(response.status).not.toBe(201);
      const flog = await FhirWriteLog.findOne({
        where: { url: { [Op.like]: '%HeadMeOff%' } },
      });
      expect(flog).toBeTruthy();
      expect(flog.verb).toEqual('POST');
      expect(flog.body).toMatchObject(body);
      expect(flog.headers).toMatchObject({
        'x-forwarded-for': '123.45.67.89',
        'x-tamanu-version': '1.23.4',
        'if-match': 'is met',
        prefer: 'pretty',
        'content-type': 'application/json',
        accept: 'application/fhir+json; fhirVersion=4.0',
        'user-agent': expect.any(String),
      });
      expect(flog.headers).not.toHaveProperty('authorization');
    }));
});
