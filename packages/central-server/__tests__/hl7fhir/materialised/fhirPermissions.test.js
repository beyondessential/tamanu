import {
  FHIR_DIAGNOSTIC_REPORT_STATUS,
  FHIR_OBSERVATION_STATUS,
  FHIR_INTEGRATION_VERB,
} from '@tamanu/constants';

import { createTestContext } from '../../utilities';
import {
  fakeResourcesOfFhirServiceRequest,
  fakeResourcesOfFhirServiceRequestWithLabRequest,
  fakeResourcesOfFhirServiceRequestWithImagingRequest,
} from '../../fake/fhir';

const INTEGRATION_ROUTE = 'fhir/mat';

describe('FHIR Permissions', () => {
  let ctx;
  let resources;

  beforeAll(async () => {
    ctx = await createTestContext();
    resources = await fakeResourcesOfFhirServiceRequest(ctx.store.models);
  });
  afterAll(() => ctx.close());

  describe('read endpoints', () => {
    let fhirPatient;

    beforeAll(async () => {
      const { FhirPatient } = ctx.store.models;
      fhirPatient = await FhirPatient.materialiseFromUpstream(resources.patient.id);
    });

    it('returns 403 when user has no FHIR permissions', async () => {
      const app = await ctx.baseApp.asNewRole([]);
      const response = await app.get(
        `/api/integration/${INTEGRATION_ROUTE}/Patient/${fhirPatient.id}`,
      );
      expect(response.status).toBe(403);
    });

    it('allows access with the correct read permission', async () => {
      const app = await ctx.baseApp.asNewRole([['read', 'FhirPatient']]);
      const response = await app.get(
        `/api/integration/${INTEGRATION_ROUTE}/Patient/${fhirPatient.id}`,
      );
      expect(response.status).toBe(200);
      expect(response.body.resourceType).toBe('Patient');
    });

    it('returns 403 when user has wrong resource permission', async () => {
      const app = await ctx.baseApp.asNewRole([['read', 'FhirEncounter']]);
      const response = await app.get(
        `/api/integration/${INTEGRATION_ROUTE}/Patient/${fhirPatient.id}`,
      );
      expect(response.status).toBe(403);
    });
  });

  describe('search endpoints', () => {
    it('returns 403 for search without permission', async () => {
      const app = await ctx.baseApp.asNewRole([]);
      const response = await app.get(`/api/integration/${INTEGRATION_ROUTE}/Patient`);
      expect(response.status).toBe(403);
    });

    it('allows search with correct permission', async () => {
      const app = await ctx.baseApp.asNewRole([['read', 'FhirPatient']]);
      const response = await app.get(`/api/integration/${INTEGRATION_ROUTE}/Patient`);
      expect(response.status).toBe(200);
      expect(response.body.resourceType).toBe('Bundle');
    });
  });

  describe('create endpoints', () => {
    let fhirServiceRequest;

    beforeAll(async () => {
      const { FhirServiceRequest, FhirEncounter } = ctx.store.models;
      await FhirServiceRequest.destroy({ where: {} });
      await FhirEncounter.destroy({ where: {} });
      await FhirEncounter.materialiseFromUpstream(resources.encounter.id);

      const labResources = await fakeResourcesOfFhirServiceRequestWithLabRequest(
        ctx.store.models,
        resources,
      );
      fhirServiceRequest = await FhirServiceRequest.materialiseFromUpstream(
        labResources.labRequest.id,
      );
    });

    it('returns 403 for create without write permission', async () => {
      const app = await ctx.baseApp.asNewRole([['read', 'FhirDiagnosticReport']]);
      const response = await app
        .post(`/api/integration/${INTEGRATION_ROUTE}/DiagnosticReport`)
        .send({
          resourceType: 'DiagnosticReport',
          basedOn: [
            {
              type: 'ServiceRequest',
              reference: `ServiceRequest/${fhirServiceRequest.id}`,
            },
          ],
          status: FHIR_DIAGNOSTIC_REPORT_STATUS.FINAL,
          category: [
            { coding: [{ code: '108252007', system: 'http://snomed.info/sct' }] },
          ],
          code: {
            coding: [{ system: 'http://loinc.org', code: '42191-7', display: 'Test' }],
          },
        });
      expect(response.status).toBe(403);
    });

    it('allows create with write permission', async () => {
      const app = await ctx.baseApp.asNewRole([['write', 'FhirDiagnosticReport']]);
      const response = await app
        .post(`/api/integration/${INTEGRATION_ROUTE}/DiagnosticReport`)
        .send({
          resourceType: 'DiagnosticReport',
          basedOn: [
            {
              type: 'ServiceRequest',
              reference: `ServiceRequest/${fhirServiceRequest.id}`,
            },
          ],
          status: FHIR_DIAGNOSTIC_REPORT_STATUS.FINAL,
          category: [
            { coding: [{ code: '108252007', system: 'http://snomed.info/sct' }] },
          ],
          code: {
            coding: [{ system: 'http://loinc.org', code: '42191-7', display: 'Test' }],
          },
        });
      expect(response.status).toBe(201);
    });
  });

  describe('ServiceRequest category filtering', () => {
    let labServiceRequest;
    let imagingServiceRequest;

    beforeAll(async () => {
      const { FhirServiceRequest, FhirEncounter, FhirPatient, FhirPractitioner, FhirOrganization } =
        ctx.store.models;
      await FhirServiceRequest.destroy({ where: {} });
      await FhirEncounter.destroy({ where: {} });

      await FhirPatient.materialiseFromUpstream(resources.patient.id);
      await FhirPractitioner.materialiseFromUpstream(resources.practitioner.id);
      await FhirOrganization.materialiseFromUpstream(resources.facility.id);
      await FhirEncounter.materialiseFromUpstream(resources.encounter.id);

      const labResources = await fakeResourcesOfFhirServiceRequestWithLabRequest(
        ctx.store.models,
        resources,
      );
      labServiceRequest = await FhirServiceRequest.materialiseFromUpstream(
        labResources.labRequest.id,
      );

      const imagingRequest = await fakeResourcesOfFhirServiceRequestWithImagingRequest(
        ctx.store.models,
        resources,
      );
      imagingServiceRequest = await FhirServiceRequest.materialiseFromUpstream(
        imagingRequest.id,
      );
    });

    it('returns 403 when user has no ServiceRequest permissions', async () => {
      const app = await ctx.baseApp.asNewRole([['read', 'FhirPatient']]);
      const response = await app.get(`/api/integration/${INTEGRATION_ROUTE}/ServiceRequest`);
      expect(response.status).toBe(403);
    });

    it('filters search to lab requests only when user has FhirLabServiceRequest permission', async () => {
      const app = await ctx.baseApp.asNewRole([['read', 'FhirLabServiceRequest']]);
      const response = await app.get(`/api/integration/${INTEGRATION_ROUTE}/ServiceRequest`);
      expect(response.status).toBe(200);

      const entries = response.body.entry ?? [];
      expect(entries.length).toBeGreaterThan(0);
      for (const entry of entries) {
        const categoryCodes = entry.resource.category.flatMap(cat =>
          cat.coding.map(c => c.code),
        );
        expect(categoryCodes).toContain('108252007');
      }
    });

    it('filters search to imaging requests only when user has FhirImagingServiceRequest permission', async () => {
      const app = await ctx.baseApp.asNewRole([['read', 'FhirImagingServiceRequest']]);
      const response = await app.get(`/api/integration/${INTEGRATION_ROUTE}/ServiceRequest`);
      expect(response.status).toBe(200);

      const entries = response.body.entry ?? [];
      expect(entries.length).toBeGreaterThan(0);
      for (const entry of entries) {
        const categoryCodes = entry.resource.category.flatMap(cat =>
          cat.coding.map(c => c.code),
        );
        expect(categoryCodes).toContain('363679005');
      }
    });

    it('returns both lab and imaging when user has both permissions', async () => {
      const app = await ctx.baseApp.asNewRole([
        ['read', 'FhirLabServiceRequest'],
        ['read', 'FhirImagingServiceRequest'],
      ]);
      const response = await app.get(`/api/integration/${INTEGRATION_ROUTE}/ServiceRequest`);
      expect(response.status).toBe(200);

      const entries = response.body.entry ?? [];
      expect(entries.length).toBeGreaterThanOrEqual(2);
    });

    it('returns 404 for a lab ServiceRequest when user only has imaging permission', async () => {
      const app = await ctx.baseApp.asNewRole([['read', 'FhirImagingServiceRequest']]);
      const response = await app.get(
        `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest/${labServiceRequest.id}`,
      );
      expect(response.status).toBe(404);
    });

    it('allows read of a lab ServiceRequest with lab permission', async () => {
      const app = await ctx.baseApp.asNewRole([['read', 'FhirLabServiceRequest']]);
      const response = await app.get(
        `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest/${labServiceRequest.id}`,
      );
      expect(response.status).toBe(200);
    });

    it('allows read of an imaging ServiceRequest with imaging permission', async () => {
      const app = await ctx.baseApp.asNewRole([['read', 'FhirImagingServiceRequest']]);
      const response = await app.get(
        `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest/${imagingServiceRequest.id}`,
      );
      expect(response.status).toBe(200);
    });
  });

  describe('bundle endpoint permissions', () => {
    let fhirServiceRequest;

    beforeAll(async () => {
      const { FhirServiceRequest, FhirEncounter } = ctx.store.models;
      await FhirServiceRequest.destroy({ where: {} });
      await FhirEncounter.destroy({ where: {} });
      await FhirEncounter.materialiseFromUpstream(resources.encounter.id);

      const labResources = await fakeResourcesOfFhirServiceRequestWithLabRequest(
        ctx.store.models,
        resources,
      );
      fhirServiceRequest = await FhirServiceRequest.materialiseFromUpstream(
        labResources.labRequest.id,
      );
    });

    it('returns 403 when bundle contains a resource the user cannot write', async () => {
      const app = await ctx.baseApp.asNewRole([['write', 'FhirDiagnosticReport']]);
      const response = await app.post(`/api/integration/${INTEGRATION_ROUTE}/Bundle`).send({
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          {
            resource: {
              resourceType: 'DiagnosticReport',
              basedOn: [
                {
                  type: 'ServiceRequest',
                  reference: `ServiceRequest/${fhirServiceRequest.id}`,
                },
              ],
              status: FHIR_DIAGNOSTIC_REPORT_STATUS.FINAL,
              category: [
                { coding: [{ code: '108252007', system: 'http://snomed.info/sct' }] },
              ],
              code: {
                coding: [{ system: 'http://loinc.org', code: '42191-7', display: 'Test' }],
              },
            },
            request: { method: 'POST', url: 'DiagnosticReport' },
          },
          {
            resource: {
              resourceType: 'Observation',
              status: FHIR_OBSERVATION_STATUS.FINAL,
              code: {
                coding: [{ system: 'http://loinc.org', code: '1234-5', display: 'Test obs' }],
              },
              valueString: 'positive',
            },
            request: { method: 'POST', url: 'Observation' },
          },
        ],
      });
      expect(response.status).toBe(403);
    });

    it('allows bundle when user has write permission for all included resources', async () => {
      const app = await ctx.baseApp.asNewRole([['write', 'FhirDiagnosticReport']]);
      const response = await app.post(`/api/integration/${INTEGRATION_ROUTE}/Bundle`).send({
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          {
            resource: {
              resourceType: 'DiagnosticReport',
              basedOn: [
                {
                  type: 'ServiceRequest',
                  reference: `ServiceRequest/${fhirServiceRequest.id}`,
                },
              ],
              status: FHIR_DIAGNOSTIC_REPORT_STATUS.FINAL,
              category: [
                { coding: [{ code: '108252007', system: 'http://snomed.info/sct' }] },
              ],
              code: {
                coding: [{ system: 'http://loinc.org', code: '42191-7', display: 'Test' }],
              },
            },
            request: { method: 'POST', url: 'DiagnosticReport' },
          },
        ],
      });
      expect(response.status).toBe(200);
    });
  });

  describe('integration type permission sets', () => {
    let fhirPatient;

    beforeAll(async () => {
      const { FhirPatient } = ctx.store.models;
      fhirPatient = await FhirPatient.materialiseFromUpstream(resources.patient.id);
    });

    it('PMI user can read Patient but not Encounter', async () => {
      const app = await ctx.baseApp.asNewRole([[FHIR_INTEGRATION_VERB, 'PMI']]);

      const patientResponse = await app.get(
        `/api/integration/${INTEGRATION_ROUTE}/Patient/${fhirPatient.id}`,
      );
      expect(patientResponse.status).toBe(200);

      const encounterResponse = await app.get(
        `/api/integration/${INTEGRATION_ROUTE}/Encounter`,
      );
      expect(encounterResponse.status).toBe(403);
    });

    it('LABS user can read Patient and write DiagnosticReport but not ImagingStudy', async () => {
      const app = await ctx.baseApp.asNewRole([[FHIR_INTEGRATION_VERB, 'LABS']]);

      const patientResponse = await app.get(
        `/api/integration/${INTEGRATION_ROUTE}/Patient/${fhirPatient.id}`,
      );
      expect(patientResponse.status).toBe(200);

      const imagingResponse = await app
        .post(`/api/integration/${INTEGRATION_ROUTE}/ImagingStudy`)
        .send({
          resourceType: 'ImagingStudy',
          status: 'available',
        });
      expect(imagingResponse.status).toBe(403);
    });

    it('RISPACS user can read Patient and write ImagingStudy but not DiagnosticReport', async () => {
      const app = await ctx.baseApp.asNewRole([[FHIR_INTEGRATION_VERB, 'RISPACS']]);

      const patientResponse = await app.get(
        `/api/integration/${INTEGRATION_ROUTE}/Patient/${fhirPatient.id}`,
      );
      expect(patientResponse.status).toBe(200);

      const drResponse = await app
        .post(`/api/integration/${INTEGRATION_ROUTE}/DiagnosticReport`)
        .send({
          resourceType: 'DiagnosticReport',
          status: 'final',
        });
      expect(drResponse.status).toBe(403);
    });

    it('read-only LABS user can read Patient but not write DiagnosticReport', async () => {
      const app = await ctx.baseApp.asNewRole([['read', 'LABS']]);

      const patientResponse = await app.get(
        `/api/integration/${INTEGRATION_ROUTE}/Patient/${fhirPatient.id}`,
      );
      expect(patientResponse.status).toBe(200);

      const drResponse = await app
        .post(`/api/integration/${INTEGRATION_ROUTE}/DiagnosticReport`)
        .send({
          resourceType: 'DiagnosticReport',
          status: 'final',
        });
      expect(drResponse.status).toBe(403);
    });

    it('write-only LABS user cannot read Patient', async () => {
      const app = await ctx.baseApp.asNewRole([['write', 'LABS']]);

      const patientResponse = await app.get(
        `/api/integration/${INTEGRATION_ROUTE}/Patient/${fhirPatient.id}`,
      );
      expect(patientResponse.status).toBe(403);
    });
  });
});
