/* eslint-disable no-unused-expressions */

import { addDays, formatRFC7231 } from 'date-fns';

import { fake } from '@tamanu/shared/test-helpers';
import {
  FHIR_DATETIME_PRECISION,
  IMAGING_REQUEST_STATUS_TYPES,
  VISIBILITY_STATUSES,
  LAB_REQUEST_STATUSES,
  FHIR_DIAGNOSTIC_REPORT_STATUS,
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

    it('fetches a service request by materialised ID (lab request)', async () => {
      const statuses = [
        FHIR_DIAGNOSTIC_REPORT_STATUS.REGISTERED,
        FHIR_DIAGNOSTIC_REPORT_STATUS.PARTIAL._,
        FHIR_DIAGNOSTIC_REPORT_STATUS.PARTIAL.PRELIMINARY,
        FHIR_DIAGNOSTIC_REPORT_STATUS.FINAL,
        FHIR_DIAGNOSTIC_REPORT_STATUS.CANCELLED,
        FHIR_DIAGNOSTIC_REPORT_STATUS.ENTERED_IN_ERROR,
        // FHIR_DIAGNOSTIC_REPORT_STATUS.AMENDED._,
        // FHIR_DIAGNOSTIC_REPORT_STATUS.AMENDED.CORRECTED,
        // FHIR_DIAGNOSTIC_REPORT_STATUS.AMENDED.APPENDED,
      ];
      // arrange
      const { FhirServiceRequest } = ctx.store.models;
      const { labRequest } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
        ctx.store.models,
        resources,
        {
          status: LAB_REQUEST_STATUSES.TO_BE_VERIFIED
        }
      );
      const mat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
      const serviceRequestId = mat.id;
      await FhirServiceRequest.resolveUpstreams();

      const path = `/v1/integration/${INTEGRATION_ROUTE}/DiagnosticReport`;
      const body = {
        resourceType: "DiagnosticReport",
        basedOn: {
          type: "ServiceRequest",
          reference: `ServiceRequest/${serviceRequestId}`
        },
        category: [
          {
            coding: [
              {
                code: "108252007",
                system: "http://snomed.info/sct"
              }
            ]
          }
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "42191-7",
              display: "Hepatitis Panel"
            }
          ]
        },
      };

      // Look I know this is pretty oldskool
      // and we like to be more declarative these days 
      // but a mapping to Promise.all will likely
      // create some bad time race conditions
      // sometimes the old ways are the best
      for (let index = 0; index < statuses.length; index++) {
        body.status = statuses[index];
        let expectedLabRequestStatus;
        if (
          body.status === FHIR_DIAGNOSTIC_REPORT_STATUS.REGISTERED ||
          body.status === FHIR_DIAGNOSTIC_REPORT_STATUS.PARTIAL._
        ) {
          expectedLabRequestStatus = LAB_REQUEST_STATUSES.TO_BE_VERIFIED;
        } else if (
          body.status === FHIR_DIAGNOSTIC_REPORT_STATUS.PARTIAL.PRELIMINARY
        ) {
          expectedLabRequestStatus = LAB_REQUEST_STATUSES.VERIFIED;
        } else if (
          body.status === FHIR_DIAGNOSTIC_REPORT_STATUS.FINAL
        ) {
          expectedLabRequestStatus = LAB_REQUEST_STATUSES.PUBLISHED;
        } else if (
          body.status === FHIR_DIAGNOSTIC_REPORT_STATUS.CANCELLED
        ) {
          expectedLabRequestStatus = LAB_REQUEST_STATUSES.CANCELLED;
        } else if (
          body.status === FHIR_DIAGNOSTIC_REPORT_STATUS.ENTERED_IN_ERROR
        ) {
          expectedLabRequestStatus = LAB_REQUEST_STATUSES.ENTERED_IN_ERROR;
        }
        const response = await app.post(path).send(body);
        await labRequest.reload();
        expect(labRequest.status).toBe(expectedLabRequestStatus);
        expect(response).toHaveSucceeded();
      }
    });

  });

});
