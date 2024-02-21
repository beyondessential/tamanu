/* eslint-disable no-unused-expressions */

import { formatRFC7231 } from 'date-fns';
import { fakeUUID } from '@tamanu/shared/utils/generateId';
import { formatFhirDate } from '@tamanu/shared/utils/fhir/datetime';

import { createTestContext } from '../../utilities';
import {
  fakeResourcesOfFhirServiceRequest,
  fakeResourcesOfFhirSpecimen,
} from '../../fake/fhir';

const INTEGRATION_ROUTE = 'fhir/mat';

describe(`Materialised FHIR - ServiceRequest`, () => {
  let ctx;
  let app;
  let resources;
  const fhirResources = {
    fhirPractitioner: null,
    fhirEncounter: null,
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
    resources = await fakeResourcesOfFhirServiceRequest(ctx.store.models);
    const { FhirPractitioner } = ctx.store.models;
    const fhirPractitioner = await FhirPractitioner.materialiseFromUpstream(
      resources.practitioner.id,
    );
    fhirResources.fhirPractitioner = fhirPractitioner;
  });
  afterAll(() => ctx.close());

  describe('materialise', () => {
    beforeEach(async () => {
      const {
        LabRequest,
        LabTestPanel,
        LabTestPanelRequest,
        FhirEncounter,
        FhirServiceRequest,
      } = ctx.store.models;
      await FhirEncounter.destroy({ where: {} });
      await FhirServiceRequest.destroy({ where: {} });
      await LabRequest.destroy({ where: {} });
      await LabTestPanel.destroy({ where: {} });
      await LabTestPanelRequest.destroy({ where: {} });

      const fhirEncounter = await FhirEncounter.materialiseFromUpstream(resources.encounter.id);
      fhirResources.fhirEncounter = fhirEncounter;

    });


    it('fetches a specimen by materialised ID', async () => {
      // arrange
      const { FhirSpecimen, FhirServiceRequest } = ctx.store.models;
      const { labRequest, specimenType, bodySiteRef } = await fakeResourcesOfFhirSpecimen(
        ctx.store.models,
        resources,
      );
      const materialisedServiceRequest = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
      const materialiseSpecimen = await FhirSpecimen.materialiseFromUpstream(labRequest.id);
      await FhirSpecimen.resolveUpstreams();
      const path = `/v1/integration/${INTEGRATION_ROUTE}/Specimen/${materialiseSpecimen.id}`;

      // act
      const response = await app.get(path);

      // normalise for comparison
      // eslint-disable-next-line no-unused-expressions
      response.body?.orderDetail?.sort((a, b) => a.text.localeCompare(b.text));
      response.body?.identifier?.sort((a, b) => a.system.localeCompare(b.system));

      const { fhirPractitioner } = fhirResources;

      // assert
      expect(response.body).toMatchObject({
        resourceType: 'Specimen',
        id: expect.any(String),
        meta: {
          lastUpdated: formatFhirDate(materialiseSpecimen.lastUpdated),
        },
        collection: {
          collectedDateTime: formatFhirDate(labRequest.sampleTime),
          collector: {
            type: 'Practitioner',
            display: fhirPractitioner.name[0].text,
            reference: `Practitioner/${fhirPractitioner.id}`
          },
          bodySite: {
            coding: [{
              code: bodySiteRef.code,
              system: 'http://bodySITE.NEW',
              display: bodySiteRef.name
            }]
          },
        },
        type: {
          coding: [{
            code: specimenType.code,
            system: 'http://www.senaite.com/data/sample_types',
            display: specimenType.name
          }]
        },
        request: [{
          type: 'ServiceRequest',
          reference: `ServiceRequest/${materialisedServiceRequest.id}`
        }]
      });
      expect(response.headers['last-modified']).toBe(formatRFC7231(new Date(materialiseSpecimen.lastUpdated)));
      expect(response).toHaveSucceeded();
    });

    it('should handle a minimal specimen elegantly', async () => {
      // arrange
      const { FhirSpecimen, FhirServiceRequest } = ctx.store.models;
      const { labRequest } = await fakeResourcesOfFhirSpecimen(
        ctx.store.models,
        resources,
        {
          labSampleSiteId: null,
          specimenTypeId: null,
          sampleTime: null,
          collectedById: null,
        }
      );
      const materialisedServiceRequest = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
      const materialiseSpecimen = await FhirSpecimen.materialiseFromUpstream(labRequest.id);
      await FhirSpecimen.resolveUpstreams();
      const path = `/v1/integration/${INTEGRATION_ROUTE}/Specimen/${materialiseSpecimen.id}`;

      // act
      const response = await app.get(path);

      // normalise for comparison
      // eslint-disable-next-line no-unused-expressions
      response.body?.orderDetail?.sort((a, b) => a.text.localeCompare(b.text));
      response.body?.identifier?.sort((a, b) => a.system.localeCompare(b.system));

      const { body, headers } = response;
      expect(body).not.toHaveProperty('type');
      expect(body).not.toHaveProperty('collection.bodySite');
      expect(body).not.toHaveProperty('collection.collectedDateTime');

      // assert
      expect(body).toMatchObject({
        resourceType: 'Specimen',
        id: expect.any(String),
        meta: {
          lastUpdated: formatFhirDate(materialiseSpecimen.lastUpdated),
        },
        request: [{
          type: 'ServiceRequest',
          reference: `ServiceRequest/${materialisedServiceRequest.id}`
        }]
      });
      expect(headers['last-modified']).toBe(formatRFC7231(new Date(materialiseSpecimen.lastUpdated)));
      expect(response).toHaveSucceeded();
    });


  });

  describe('search', () => {
    const specimens = [];
    beforeAll(async () => {
      const { FhirSpecimen, FhirServiceRequest } = ctx.store.models;
      await FhirSpecimen.destroy({ where: {} });

      specimens.push(await makeSpecimen());
      specimens.push(await makeSpecimen());
      specimens.push(await makeSpecimen());
      async function makeSpecimen(overrides = {}) {
        const { labRequest } = await fakeResourcesOfFhirSpecimen(
          ctx.store.models,
          resources,
          overrides
        );
        await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
        const materialiseSpecimen = await FhirSpecimen.materialiseFromUpstream(labRequest.id);
        return [labRequest, materialiseSpecimen];
      }
    });

    it('should return a list when passed no query params', async () => {
      const response = await app.get(`/v1/integration/${INTEGRATION_ROUTE}/Specimen`);

      expect(response.body.total).toBe(3);
      expect(response.body.entry).toHaveLength(3);
      expect(response).toHaveSucceeded();
    });
    
    describe('sorts', () => {
      it('should sort by lastUpdated ascending', async () => {
        const response = await app.get(
          `/v1/integration/${INTEGRATION_ROUTE}/Specimen?_sort=_lastUpdated`,
        );

        expect(response.body.total).toBe(3);
        expect(response.body.entry.map(entry => entry.resource.id)).toEqual(
          specimens.map(([, mat]) => mat.id),
        );
        expect(response).toHaveSucceeded();
      });

      it('should sort by lastUpdated descending', async () => {
        const response = await app.get(
          `/v1/integration/${INTEGRATION_ROUTE}/Specimen?_sort=-_lastUpdated`,
        );

        expect(response.body.total).toBe(3);
        expect(response.body.entry.map(entry => entry.resource.id)).toEqual(
          specimens.map(([, mat]) => mat.id).reverse(),
        );
        expect(response).toHaveSucceeded();
      });
    });

    describe('including', () => {
        const resolveUpstreams = async (sequelize) => {
        const result = await sequelize.query(`
            CALL fhir.resolve_upstreams();      
          `);
        return result;
      };
  
      beforeEach(async () => {
        const { models } = ctx.store;
        const { FhirSpecimen, FhirPractitioner, LabRequest } = models;
        await FhirSpecimen.destroy({ where: {} });
        await FhirPractitioner.destroy({ where: {} });
        await LabRequest.destroy({ where: {} });
      });

      it('correctly includes a practitioner', async () => {
        const { models, sequelize } = ctx.store;
        const { FhirSpecimen, FhirPractitioner } = models;
        const { labRequest } = await fakeResourcesOfFhirSpecimen(models, resources);
        // const materialisedServiceRequest = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
        const materialiseSpecimen = await FhirSpecimen.materialiseFromUpstream(labRequest.id);
        const materialisePractitioner = await FhirPractitioner.materialiseFromUpstream(labRequest.collectedById);
        
        await resolveUpstreams(sequelize);
        
        const path = `/v1/integration/${INTEGRATION_ROUTE}/Specimen?_include=Practitioner:collector`;
        const response = await app.get(path);
        const { entry } = response.body;

        console.log({ response });
        const fetchedSpecimen = entry.find(
          ({ search: { mode } }) => mode === 'match',
        );
  
        const includedPractitioner = entry.find(
          ({ search: { mode } }) => mode === 'include',
        );
        expect(response).toHaveSucceeded();
        expect(includedPractitioner).toBeDefined();
        expect(fetchedSpecimen.resource.id).toBe(materialiseSpecimen.id);
        expect(includedPractitioner.resource.id).toBe(materialisePractitioner.id);
        expect(response.body.entry.length).toBe(2);
      });
    });
  });

  describe('errors', () => {
    it('returns not found when fetching a non-existent specimen', async () => {
      // arrange
      const id = fakeUUID();
      const path = `/v1/integration/${INTEGRATION_ROUTE}/Specimen/${id}`;

      // act
      const response = await app.get(path);

      // assert
      expect(response.body).toMatchObject({
        resourceType: 'OperationOutcome',
        id: expect.any(String),
        issue: [
          {
            severity: 'error',
            code: 'not-found',
            diagnostics: expect.any(String),
            details: {
              text: `no Specimen with id ${id}`,
            },
          },
        ],
      });
      expect(response.status).toBe(404);
    });

    it('returns an error if there are any unknown search params', async () => {
      // arrange
      const path = `/v1/integration/${INTEGRATION_ROUTE}/Specimen?whatever=something`;

      // act
      const response = await app.get(path);

      // assert
      expect(response.body).toMatchObject({
        resourceType: 'OperationOutcome',
        id: expect.any(String),
        issue: [
          {
            severity: 'error',
            code: 'not-supported',
            diagnostics: expect.any(String),
            details: {
              text: 'parameter is not supported: whatever',
            },
          },
        ],
      });
      expect(response).toHaveRequestError(501);
    });
  });
});
