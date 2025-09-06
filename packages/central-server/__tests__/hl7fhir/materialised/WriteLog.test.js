import { Op } from 'sequelize';

import { showError } from '@tamanu/shared/test-helpers';
import { SCRUBBED_DATA_MESSAGE } from '@tamanu/constants';

import { createTestContext } from '../../utilities';

const INTEGRATION_ROUTE = 'fhir/mat';

jest.mock('@tamanu/constants', () => {
  const constants = jest.requireActual('@tamanu/constants');

  //Mock the default export and named export 'foo'
  return {
    ...constants,
    HTTP_BODY_DATA_PATHS: {
      DATA_LOCATION: '$.presentedForm[*].data',
      STATUS: '$.staples',
      CODE_DISPLAY: '$.code.coding[*].display',
    },
  };
});

const attemptFlogRetrieval = async (FhirWriteLog, options) => {
  let flog;
  for (let i = 0; i < 10; i++) {
    flog = await FhirWriteLog.findOne(options);
    if (flog) {
      break;
    }
  }
  return flog;
};

describe(`Materialised FHIR - WriteLog`, () => {
  let ctx;
  let app;
  let FhirWriteLog;

  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  beforeEach(async () => {
    ({ FhirWriteLog } = ctx.store.models);
    await FhirWriteLog.destroy({ where: {} });
  });

  it('logs a request for a non-existent resource', () =>
    showError(async () => {
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
      const response = await app.post(`/api/integration/${INTEGRATION_ROUTE}/FooBarBaz`).send(body);

      expect(response.status).not.toBe(201);
      const flog = await attemptFlogRetrieval(FhirWriteLog, {
        where: { url: { [Op.like]: '%FooBarBaz%' } },
      });
      expect(flog).toBeTruthy();
      expect(flog.verb).toEqual('POST');
      expect(flog.body).toMatchObject(body);
    }));

  it('logs a request for a malformed resource', () =>
    showError(async () => {
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
      const response = await app.post(`/api/integration/${INTEGRATION_ROUTE}/FooBarBaz`).send(body);

      expect(response.status).not.toBe(201);
      const flog = await attemptFlogRetrieval(FhirWriteLog, {
        where: { url: { [Op.like]: '%FooBarBaz%' } },
      });
      expect(flog).toBeTruthy();
      expect(flog.verb).toEqual('POST');
      expect(flog.body).toMatchObject(body);
    }));

  it('logs the headers', () =>
    showError(async () => {
      const body = {
        resourceType: 'HeadMeOff',
        at: 'the pass',
      };
      const response = await app
        .post(`/api/integration/${INTEGRATION_ROUTE}/HeadMeOff`)
        .set('X-Forwarded-For', '123.45.67.89')
        .set('Authz', 'lmao')
        .set('X-Tamanu-Field', 'it me')
        .set('If-Match', 'is met')
        .set('Prefer', 'pretty')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/fhir+json; fhirVersion=4.0')
        .send(body);

      expect(response.status).not.toBe(201);
      const flog = await attemptFlogRetrieval(FhirWriteLog, {
        where: { url: { [Op.like]: '%HeadMeOff%' } },
      });
      expect(flog).toBeTruthy();
      expect(flog.verb).toEqual('POST');
      expect(flog.body).toMatchObject(body);
      expect(flog.headers).toMatchObject({
        'x-forwarded-for': '123.45.67.89',
        'x-tamanu-field': 'it me',
        'if-match': 'is met',
        prefer: 'pretty',
        'content-type': 'application/json',
        accept: 'application/fhir+json; fhirVersion=4.0',
      });
      expect(flog.headers).not.toHaveProperty('authorization');
    }));

  it('scrubs raw data in specified locations from the body', () =>
    showError(async () => {
      const body = {
        resourceType: 'FuchBaz',
        staples: 'replace this',
        nope: [
          {
            system: 'http://example.com',
            value: 'ACCESSION',
          },
        ],
        presentedForm: [
          {
            presentedForm: [
              {
                language: 'en',
                data: 'do not replace this',
              },
            ],
            language: 'en',
            data: 'replace this',
          },
          {
            baz: 'angu',
            language: 'en',
            data: 'replace this',
          },
        ],
        code: {
          coding: [
            {
              system: 'http://encoding.org',
              code: 'COD-123',
              display: 'replace this',
            },
          ],
        },
        burger: [
          {
            presentedForm: [
              {
                language: 'en',
                data: 'do not replace this',
              },
            ],
            identifier: {
              system: 'http://example.com',
              value: '123',
            },
          },
        ],
      };
      const response = await app.post(`/api/integration/${INTEGRATION_ROUTE}/FuchBaz`).send(body);

      expect(response.status).not.toBe(201);
      const flog = await attemptFlogRetrieval(FhirWriteLog, {
        where: { url: { [Op.like]: '%FuchBaz%' } },
      });
      expect(flog.verb).toEqual('POST');
      expect(flog.body).toMatchObject({
        resourceType: 'FuchBaz',
        staples: SCRUBBED_DATA_MESSAGE,
        nope: [
          {
            system: 'http://example.com',
            value: 'ACCESSION',
          },
        ],
        presentedForm: [
          {
            presentedForm: [
              {
                language: 'en',
                data: 'do not replace this',
              },
            ],
            language: 'en',
            data: SCRUBBED_DATA_MESSAGE,
          },
          {
            baz: 'angu',
            language: 'en',
            data: SCRUBBED_DATA_MESSAGE,
          },
        ],
        code: {
          coding: [
            {
              system: 'http://encoding.org',
              code: 'COD-123',
              display: SCRUBBED_DATA_MESSAGE,
            },
          ],
        },
        burger: [
          {
            presentedForm: [
              {
                language: 'en',
                data: 'do not replace this',
              },
            ],
            identifier: {
              system: 'http://example.com',
              value: '123',
            },
          },
        ],
      });
    }));
});
