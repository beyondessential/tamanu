/* eslint-disable no-unused-expressions */

import { addDays, formatRFC7231 } from 'date-fns';

import { fake } from '@tamanu/shared/test-helpers';
import { fakeUUID } from '@tamanu/shared/utils/generateId';
import { formatFhirDate } from '@tamanu/shared/utils/fhir/datetime';

import { createTestContext } from '../../utilities';
import {
  fakeResourcesOfFhirServiceRequest,
  fakeResourcesOfFhirServiceRequestWithLabRequest,
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
        FhirServiceRequest,
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
      const { FhirSpecimen } = ctx.store.models;
      const { labTestPanel, labRequest } = await fakeResourcesOfFhirSpecimen(
        ctx.store.models,
        resources,
      );
      const mat = await FhirSpecimen.materialiseFromUpstream(labRequest.id);
      await FhirSpecimen.resolveUpstreams();
      console.log({ mat });
      const path = `/v1/integration/${INTEGRATION_ROUTE}/Specimen/${mat.id}`;

      // act
      const response = await app.get(path);

      // normalise for comparison
      // eslint-disable-next-line no-unused-expressions
      response.body?.orderDetail?.sort((a, b) => a.text.localeCompare(b.text));
      response.body?.identifier?.sort((a, b) => a.system.localeCompare(b.system));

       const {  fhirPractitioner } = fhirResources;
       console.log({ fhirPractitioner });

      // assert
      expect(response.body).toMatchObject({
        resourceType: 'Specimen',
        id: expect.any(String),
        meta: {
          lastUpdated: formatFhirDate(mat.lastUpdated),
        },
        sampleTime: formatFhirDate(labRequest.sampleTime),
        collection: {
          collectedDateTime: formatFhirDate(mat.sampleTime),
          collector: {
            type: 'Practitioner',
            display: fhirPractitioner.name[0].text,
            reference: `Practitioner/${fhirPractitioner.id}`
          }
        }
      });
      expect(response.headers['last-modified']).toBe(formatRFC7231(new Date(mat.lastUpdated)));
      expect(response).toHaveSucceeded();
    });

  });

});
