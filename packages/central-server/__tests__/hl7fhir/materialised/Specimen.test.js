/* eslint-disable no-unused-expressions */

import { formatRFC7231 } from 'date-fns';

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
      } = ctx.store.models;
      await FhirEncounter.destroy({ where: {} });
      //await FhirServiceRequest.destroy({ where: {} });
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

    it('does not return empty or null values', async () => {
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

  });

  describe('materialise', () => {
    test.todo('should return a list when passed no query params');
    describe('sorts', () => {
      test.todo('should sort by lastUpdated ascending');
      test.todo('should sort by lastUpdated descending');
    });
    describe('filters', () => {
      test.todo('should filter by identifier');

    })
  });
  describe('errors', () => {
    test.todo('returns not found when fetching a non-existent practitioner');
    test.todo('returns an error if there are any unknown search params');
  });
});
