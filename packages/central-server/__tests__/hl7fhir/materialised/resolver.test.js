import { fake } from '@tamanu/fake-data/helpers';

import { createTestContext } from '../../utilities';
import { fakeResourcesOfFhirServiceRequest } from '../../fake/fhir';
import { sleepAsync } from '../../../../utils/dist/cjs/sleepAsync';

const INTEGRATION_ROUTE = 'fhir/mat';

// Mock out sleepAsync so that we don't have to wait for the unresolved resource timeout
const sleepAsyncMock = jest.fn();

jest.mock('@tamanu/utils/sleepAsync', () => ({
  sleepAsync: (ms) => sleepAsyncMock(ms),
}));

describe(`FHIR reference resolution`, () => {
  let ctx;
  let app;
  let resources;

  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
    resources = await fakeResourcesOfFhirServiceRequest(ctx.store.models);
  });

  afterAll(() => ctx.close());

  describe('resource resolution', () => {
    beforeEach(async () => {
      const {
        FhirServiceRequest,
        ImagingRequest,
        ImagingRequestArea,
        LabRequest,
        LabTestPanel,
        LabTestPanelRequest,
        FhirEncounter,
        FhirOrganization,
        FhirPractitioner,
      } = ctx.store.models;
      await FhirEncounter.destroy({ where: {} });
      await FhirOrganization.destroy({ where: {} });
      await FhirPractitioner.destroy({ where: {} });
      await FhirServiceRequest.destroy({ where: {} });
      await ImagingRequest.destroy({ where: {} });
      await ImagingRequestArea.destroy({ where: {} });
      await LabRequest.destroy({ where: {} });
      await LabTestPanel.destroy({ where: {} });
      await LabTestPanelRequest.destroy({ where: {} });
    });

    it('When materialising a resource, references will be resolved if they exist and unresolved otherwise', async () => {
      // arrange
      const { FhirServiceRequest, ImagingRequest } = ctx.store.models;
      const ir = await ImagingRequest.create(
        fake(ImagingRequest, {
          requestedById: resources.practitioner.id,
          encounterId: resources.encounter.id,
          locationGroupId: resources.locationGroup.id,
        }),
      );

      const mat = await FhirServiceRequest.materialiseFromUpstream(ir.id);
      await mat.reload();

      // assert
      expect(mat).toMatchObject({
        // Patient has been materialised
        subject: {
          type: 'Patient',
          reference: `Patient/${resources.fhirPatient.id}`,
          display: `${resources.patient.firstName} ${resources.patient.lastName}`,
        },

        // Encounter and Practitioner have not been materialised so they should remain unresolved
        encounter: {
          type: 'upstream://encounter',
          reference: resources.encounter.id,
        },
        requester: {
          type: 'upstream://practitioner',
          reference: resources.practitioner.id,
          display: resources.practitioner.displayName,
        },
      });

      expect(mat.resolved).toBe(false);
    });

    it('will resolve references in a resource if they exist, and will mark the resource as resolved if all references have been resolved', async () => {
      // arrange
      const {
        FhirServiceRequest,
        ImagingRequest,
        FhirEncounter,
        FhirOrganization,
        FhirPractitioner,
      } = ctx.store.models;
      const ir = await ImagingRequest.create(
        fake(ImagingRequest, {
          requestedById: resources.practitioner.id,
          encounterId: resources.encounter.id,
          locationGroupId: resources.locationGroup.id,
        }),
      );

      const mat = await FhirServiceRequest.materialiseFromUpstream(ir.id);

      // act
      await FhirOrganization.materialiseFromUpstream(resources.facility.id);
      const fhirEncounter = await FhirEncounter.materialiseFromUpstream(resources.encounter.id);
      await FhirServiceRequest.resolveUpstreams();
      await mat.reload();

      // assert
      expect(mat).toMatchObject({
        // Encounter and Patient have been materialised
        subject: {
          type: 'Patient',
          reference: `Patient/${resources.fhirPatient.id}`,
          display: `${resources.patient.firstName} ${resources.patient.lastName}`,
        },
        encounter: {
          type: 'Encounter',
          reference: `Encounter/${fhirEncounter.id}`,
        },

        // Practitioner has not been materialised so they should remain unresolved
        requester: {
          type: 'upstream://practitioner',
          reference: resources.practitioner.id,
          display: resources.practitioner.displayName,
        },
      });

      expect(mat.resolved).toBe(false);

      // act
      const fhirPractitioner = await FhirPractitioner.materialiseFromUpstream(
        resources.practitioner.id,
      );
      await FhirServiceRequest.resolveUpstreams();

      await mat.reload();

      // assert
      expect(mat).toMatchObject({
        subject: {
          type: 'Patient',
          reference: `Patient/${resources.fhirPatient.id}`,
          display: `${resources.patient.firstName} ${resources.patient.lastName}`,
        },
        encounter: {
          type: 'Encounter',
          reference: `Encounter/${fhirEncounter.id}`,
        },
        requester: {
          type: 'Practitioner',
          reference: `Practitioner/${fhirPractitioner.id}`,
          display: resources.practitioner.displayName,
        },
      });

      expect(mat.resolved).toBe(true);
    });

    /**
     * TODO: Rework bumping last updated when resolving references so that we don't bump if no real changes have occurred
     */
    it('resolving a reference should increase the last_updated', async () => {
      // arrange
      const {
        FhirServiceRequest,
        ImagingRequest,
        FhirEncounter,
        FhirOrganization,
        FhirPractitioner,
      } = ctx.store.models;
      const ir = await ImagingRequest.create(
        fake(ImagingRequest, {
          requestedById: resources.practitioner.id,
          encounterId: resources.encounter.id,
          locationGroupId: resources.locationGroup.id,
        }),
      );

      const mat = await FhirServiceRequest.materialiseFromUpstream(ir.id);
      let previousLastUpdated = mat.lastUpdated.toISOString();

      // No references should have been resolved, so expect no bump to lastUpdated (but does for now)
      await sleepAsync(100);
      await FhirServiceRequest.resolveUpstreams();
      await mat.reload();
      expect(mat.lastUpdated.toISOString() > previousLastUpdated).toBe(true);
      previousLastUpdated = mat.lastUpdated.toISOString();

      // A reference should have resolved, so expect to bump lastUpdated
      await sleepAsync(100);
      await FhirOrganization.materialiseFromUpstream(resources.facility.id);
      await FhirEncounter.materialiseFromUpstream(resources.encounter.id);
      await FhirServiceRequest.resolveUpstreams();
      await mat.reload();
      expect(mat.lastUpdated.toISOString() > previousLastUpdated).toBe(true);
      previousLastUpdated = mat.lastUpdated.toISOString();

      // A reference should have resolved, so expect to bump lastUpdated
      await sleepAsync(100);
      await FhirPractitioner.materialiseFromUpstream(resources.practitioner.id);
      await FhirServiceRequest.resolveUpstreams();
      await mat.reload();
      expect(mat.lastUpdated.toISOString() > previousLastUpdated).toBe(true);
      previousLastUpdated = mat.lastUpdated.toISOString();

      // Already fully resolved, so expect no bump to lastUpdated
      await sleepAsync(100);
      await FhirServiceRequest.resolveUpstreams();
      await mat.reload();
      expect(mat.lastUpdated.toISOString()).toEqual(previousLastUpdated);
    });

    describe('FHIR API', () => {
      it('will throw an exception if the resource does not resolve within the given timeout', async () => {
        // arrange
        const { FhirServiceRequest, ImagingRequest } = ctx.store.models;
        const ir = await ImagingRequest.create(
          fake(ImagingRequest, {
            requestedById: resources.practitioner.id,
            encounterId: resources.encounter.id,
            locationGroupId: resources.locationGroup.id,
          }),
        );

        const mat = await FhirServiceRequest.materialiseFromUpstream(ir.id);

        // act
        const path = `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest/${mat.id}`;
        const response = await app.get(path);

        // assert
        expect(response.body).toMatchObject({
          resourceType: 'OperationOutcome',
          id: expect.any(String),
          issue: [
            {
              severity: 'error',
              code: 'transient',
              diagnostics: expect.any(String),
              details: {
                text: `ValidationError: Awaiting resource ServiceRequest/${mat.id} resolution timed out after 20000ms`,
              },
            },
          ],
        });
        expect(response.status).toBe(500);
      });

      it('will return the resource if it resolves while being awaited', async () => {
        // arrange
        const {
          FhirServiceRequest,
          ImagingRequest,
          FhirEncounter,
          FhirOrganization,
          FhirPractitioner,
        } = ctx.store.models;
        const ir = await ImagingRequest.create(
          fake(ImagingRequest, {
            requestedById: resources.practitioner.id,
            encounterId: resources.encounter.id,
            locationGroupId: resources.locationGroup.id,
          }),
        );

        const mat = await FhirServiceRequest.materialiseFromUpstream(ir.id);

        // act
        const path = `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest/${mat.id}`;
        const responsePromise = app.get(path);

        await FhirOrganization.materialiseFromUpstream(resources.facility.id);
        const fhirEncounter = await FhirEncounter.materialiseFromUpstream(resources.encounter.id);
        const fhirPractitioner = await FhirPractitioner.materialiseFromUpstream(
          resources.practitioner.id,
        );
        await FhirServiceRequest.resolveUpstreams();

        // assert
        const response = await responsePromise;
        expect(response.body).toMatchObject({
          subject: {
            type: 'Patient',
            reference: `Patient/${resources.fhirPatient.id}`,
            display: `${resources.patient.firstName} ${resources.patient.lastName}`,
          },
          encounter: {
            type: 'Encounter',
            reference: `Encounter/${fhirEncounter.id}`,
          },
          requester: {
            type: 'Practitioner',
            reference: `Practitioner/${fhirPractitioner.id}`,
            display: resources.practitioner.displayName,
          },
        });

        await mat.reload();
        expect(mat.resolved).toBe(true);
      });

      it('will not return unresolved resources when searching for resources', async () => {
        // arrange
        const { FhirServiceRequest, ImagingRequest } = ctx.store.models;
        const ir = await ImagingRequest.create(
          fake(ImagingRequest, {
            requestedById: resources.practitioner.id,
            encounterId: resources.encounter.id,
            locationGroupId: resources.locationGroup.id,
          }),
        );

        const mat = await FhirServiceRequest.materialiseFromUpstream(ir.id);

        // act
        const path = `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest`;
        const response = await app.get(path);

        // assert
        expect(response.body).toMatchObject({ entry: [], total: 0 });

        expect(response).toHaveSucceeded();
        expect(mat.resolved).toBe(false);
      });

      it('will return resources once they have been resolved when searching for resources', async () => {
        // arrange
        const {
          FhirServiceRequest,
          ImagingRequest,
          FhirEncounter,
          FhirOrganization,
          FhirPractitioner,
        } = ctx.store.models;
        const ir = await ImagingRequest.create(
          fake(ImagingRequest, {
            requestedById: resources.practitioner.id,
            encounterId: resources.encounter.id,
            locationGroupId: resources.locationGroup.id,
          }),
        );

        const mat = await FhirServiceRequest.materialiseFromUpstream(ir.id);

        // act
        const path = `/api/integration/${INTEGRATION_ROUTE}/ServiceRequest`;
        let response = await app.get(path);

        // assert
        expect(response.body).toMatchObject({ entry: [], total: 0 });

        expect(response).toHaveSucceeded();
        expect(mat.resolved).toBe(false);

        await FhirOrganization.materialiseFromUpstream(resources.facility.id);
        const fhirEncounter = await FhirEncounter.materialiseFromUpstream(resources.encounter.id);
        const fhirPractitioner = await FhirPractitioner.materialiseFromUpstream(
          resources.practitioner.id,
        );
        await FhirServiceRequest.resolveUpstreams();

        response = await app.get(path);

        expect(response.body.total).toBe(1);
        expect(response.body.entry[0].resource).toMatchObject({
          subject: {
            type: 'Patient',
            reference: `Patient/${resources.fhirPatient.id}`,
            display: `${resources.patient.firstName} ${resources.patient.lastName}`,
          },
          encounter: {
            type: 'Encounter',
            reference: `Encounter/${fhirEncounter.id}`,
          },
          requester: {
            type: 'Practitioner',
            reference: `Practitioner/${fhirPractitioner.id}`,
            display: resources.practitioner.displayName,
          },
        });

        await mat.reload();
        expect(mat.resolved).toBe(true);
      });
    });
  });
});
