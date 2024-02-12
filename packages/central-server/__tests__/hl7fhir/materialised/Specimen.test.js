/* eslint-disable no-unused-expressions */

import { addDays, formatRFC7231 } from 'date-fns';

import { fake } from '@tamanu/shared/test-helpers';
import {
  FHIR_DATETIME_PRECISION,
  IMAGING_REQUEST_STATUS_TYPES,
  NOTE_TYPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { fakeUUID } from '@tamanu/shared/utils/generateId';
import { formatFhirDate } from '@tamanu/shared/utils/fhir/datetime';

import { createTestContext } from '../../utilities';
import {
  fakeResourcesOfFhirServiceRequest,
  fakeResourcesOfFhirServiceRequestWithLabRequest,
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
        ImagingRequest,
        ImagingRequestArea,
        LabRequest,
        LabTestPanel,
        LabTestPanelRequest,
        FhirEncounter,
      } = ctx.store.models;
      await FhirEncounter.destroy({ where: {} });
      await FhirServiceRequest.destroy({ where: {} });
      await ImagingRequest.destroy({ where: {} });
      await ImagingRequestArea.destroy({ where: {} });
      await LabRequest.destroy({ where: {} });
      await LabTestPanel.destroy({ where: {} });
      await LabTestPanelRequest.destroy({ where: {} });

      const fhirEncounter = await FhirEncounter.materialiseFromUpstream(resources.encounter.id);
      fhirResources.fhirEncounter = fhirEncounter;
    });


    it('fetches a specimen by materialised ID', async () => {
      // arrange
      const { FhirServiceRequest } = ctx.store.models;
      const { labTestPanel, labRequest } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
        ctx.store.models,
        resources,
      );
      const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
      await FhirServiceRequest.resolveUpstreams();

      const path = `/v1/integration/${INTEGRATION_ROUTE}/ServiceRequest/${mat.id}`;

      // act
      const response = await app.get(path);

      // normalise for comparison
      // eslint-disable-next-line no-unused-expressions
      response.body?.orderDetail?.sort((a, b) => a.text.localeCompare(b.text));
      response.body?.identifier?.sort((a, b) => a.system.localeCompare(b.system));

      // assert
      expect(response.body).toMatchObject({
        resourceType: 'ServiceRequest',
        id: expect.any(String),
        meta: {
          lastUpdated: formatFhirDate(mat.lastUpdated),
        },
        identifier: [
          {
            system: 'http://data-dictionary.tamanu-fiji.org/tamanu-id-labrequest.html',
            value: labRequest.id,
          },
          {
            system: 'http://data-dictionary.tamanu-fiji.org/tamanu-mrid-labrequest.html',
            value: labRequest.displayId,
          },
        ],
        status: 'completed',
        intent: 'order',
        category: [
          {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: '108252007',
              },
            ],
          },
        ],
        priority: 'routine',
        code: {
          coding: [
            {
              code: labTestPanel.externalCode,
              display: labTestPanel.name,
              system:
                'http://intersystems.com/fhir/extn/sda3/lib/code-table-translated-prior-codes',
            },
          ],
        },
        orderDetail: [],
        subject: {
          reference: `Patient/${resources.fhirPatient.id}`,
          type: 'Patient',
          display: `${resources.patient.firstName} ${resources.patient.lastName}`,
        },
        encounter: {
          reference: `Encounter/${fhirResources.fhirEncounter.id}`,
          type: 'Encounter',
        },
        occurrenceDateTime: formatFhirDate('2022-07-27 16:30:00'),
        requester: {
          type: 'Practitioner',
          reference: `Practitioner/${fhirResources.fhirPractitioner.id}`,
          display: fhirResources.fhirPractitioner.name[0].text,
        },
        locationCode: [],
        note: [],
      });
      expect(response.headers['last-modified']).toBe(formatRFC7231(new Date(mat.lastUpdated)));
      expect(response).toHaveSucceeded();

      // regression EPI-403
      expect(response.body.subject).not.toHaveProperty('identifier');
    });

  });

});
