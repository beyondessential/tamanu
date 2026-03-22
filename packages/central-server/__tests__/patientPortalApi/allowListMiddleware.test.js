import express from 'express';
import supertest from 'supertest';

import { allowListMiddleware } from '../../app/patientPortalApi/surveys';

describe('allowListMiddleware', () => {
  const buildApp = allowed => {
    const app = express();
    const router = express.Router();

    // Mount a couple of dummy endpoints to simulate suggester routes
    router.get('/drug', (_req, res) => res.send({ ok: true, endpoint: 'drug' }));
    router.get('/patient', (_req, res) => res.send({ ok: true, endpoint: 'patient' }));
    router.get('/patient/123', (_req, res) => res.send({ ok: true, endpoint: 'patient-id' }));

    app.use('/api/portal/suggestions', allowListMiddleware(allowed), router);
    return supertest(app);
  };

  it('allows requests whose first path segment is in the list', async () => {
    const request = buildApp(['drug']);
    const res = await request.get('/api/portal/suggestions/drug');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, endpoint: 'drug' });
  });

  it('blocks requests for endpoints not in the list', async () => {
    const request = buildApp(['drug']);
    const res = await request.get('/api/portal/suggestions/patient');
    expect(res.status).toBe(404);
  });

  it('uses only the first segment for matching (ignores subpaths)', async () => {
    const request = buildApp(['patient']);
    const res = await request.get('/api/portal/suggestions/patient/123');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, endpoint: 'patient-id' });
  });

  it('blocks when allow list is empty', async () => {
    const request = buildApp([]);
    const res = await request.get('/api/portal/suggestions/drug');
    expect(res.status).toBe(404);
  });
});
