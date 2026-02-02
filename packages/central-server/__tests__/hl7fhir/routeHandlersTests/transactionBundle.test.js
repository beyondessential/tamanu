import config from 'config';

import { fake, fakeReferenceData } from '@tamanu/fake-data/fake';

import { createTestContext } from '../../utilities';
import {
  FHIR_DIAGNOSTIC_REPORT_STATUS,
  FHIR_OBSERVATION_STATUS,
  IMAGING_REQUEST_STATUS_TYPES,
  LAB_REQUEST_STATUSES,
} from '@tamanu/constants';
import { fakeResourcesOfFhirServiceRequestWithLabRequest } from '../../fake/fhir';

const PATH = '/api/integration/fhir/mat/Bundle';

describe(`FHIR API - Transaction Bundle`, () => {
  let ctx;
  let app;
  let resources;

  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');

    const {
      Department,
      Facility,
      ImagingAreaExternalCode,
      Location,
      Patient,
      ReferenceData,
      User,
      FhirPatient,
      Encounter,
    } = ctx.store.models;

    const [practitioner, patient, area1, area2, facility] = await Promise.all([
      User.create(fake(User)),
      Patient.create(fake(Patient)),
      ReferenceData.create({ ...fakeReferenceData('xRay'), type: 'xRayImagingArea' }),
      ReferenceData.create({ ...fakeReferenceData('xRay'), type: 'xRayImagingArea' }),
      Facility.create(fake(Facility)),
    ]);

    const location = await Location.create(fake(Location, { facilityId: facility.id }));
    const department = await Department.create(
      fake(Department, { locationId: location.id, facilityId: facility.id }),
    );

    const [extCode1, extCode2, pat] = await Promise.all([
      ImagingAreaExternalCode.create(fake(ImagingAreaExternalCode, { areaId: area1.id })),
      ImagingAreaExternalCode.create(fake(ImagingAreaExternalCode, { areaId: area2.id })),
      FhirPatient.materialiseFromUpstream(patient.id),
    ]);

    const encounter = await Encounter.create(
      fake(Encounter, {
        patientId: patient.id,
        locationId: location.id,
        departmentId: department.id,
        examinerId: practitioner.id,
      }),
    );

    resources = {
      encounter,
      practitioner,
      patient,
      area1,
      area2,
      facility,
      location,
      department,
      extCode1,
      extCode2,
      pat,
    };
  });
  afterAll(() => ctx.close());

  describe('success', () => {
    beforeEach(async () => {
      const {
        FhirServiceRequest,
        FhirWriteLog,
        ImagingRequest,
        ImagingRequestArea,
        ImagingResult,
        LabRequest,
        LabTestPanel,
        LabTestPanelRequest,
      } = ctx.store.models;
      await FhirWriteLog.destroy({ where: {} });
      await FhirServiceRequest.destroy({ where: {} });
      await ImagingRequest.destroy({ where: {} });
      await ImagingRequestArea.destroy({ where: {} });
      await ImagingResult.destroy({ where: {} });
      await FhirServiceRequest.destroy({ where: {} });
      await ImagingRequest.destroy({ where: {} });
      await ImagingRequestArea.destroy({ where: {} });
      await LabRequest.destroy({ where: {} });
      await LabTestPanel.destroy({ where: {} });
      await LabTestPanelRequest.destroy({ where: {} });
    });

    it('Can process multiple resources in a transaction bundle', async () => {
      // arrange
      const { FhirServiceRequest, LabTest, LabTestType } = ctx.store.models;

      await FhirServiceRequest.resolveUpstreams();
      const { labRequest } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
        ctx.store.models,
        resources,
        false,
        {
          status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
        },
      );
      const labMat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
      const labTests = await LabTest.findAll({
        include: [{ model: LabTestType, as: 'labTestType' }],
        where: { labRequestId: labRequest.id },
      });
      await FhirServiceRequest.resolveUpstreams();

      // act
      const body = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          {
            resource: {
              resourceType: 'DiagnosticReport',
              basedOn: [
                {
                  type: 'ServiceRequest',
                  reference: `ServiceRequest/${labMat.id}`,
                },
              ],
              status: FHIR_DIAGNOSTIC_REPORT_STATUS.FINAL,
              category: [
                {
                  coding: [
                    {
                      code: '108252007',
                      system: 'http://snomed.info/sct',
                    },
                  ],
                },
              ],
              code: {
                coding: [
                  {
                    system: 'http://loinc.org',
                    code: '42191-7',
                    display: 'Hepatitis Panel',
                  },
                ],
              },
            },
            request: {
              method: 'POST',
              url: `/api/integration/fhir/mat/DiagnosticReport`,
            },
          },
          ...labTests.map((labTest, index) => ({
            resource: {
              resourceType: 'Observation',
              basedOn: [
                {
                  type: 'ServiceRequest',
                  reference: `ServiceRequest/${labMat.id}`,
                },
              ],
              status: FHIR_OBSERVATION_STATUS.FINAL,
              code: {
                coding: [
                  {
                    system: config.hl7.dataDictionaries.serviceRequestLabTestCodeSystem,
                    code: labTest.labTestType.code,
                  },
                  {
                    system: config.hl7.dataDictionaries.serviceRequestLabTestExternalCodeSystem,
                    code: labTest.labTestType.externalCode,
                  },
                ],
              },
              value: {
                valueString: `Result ${index}`,
              },
            },
            request: {
              method: 'POST',
              url: `/api/integration/fhir/mat/Observation`,
            },
          })),
        ],
      };
      const response = await app.post(PATH).send(body);

      // assert
      expect(response).toHaveSucceeded();
      expect(response.status).toBe(200);
      expect(response.body.resourceType).toBe('Bundle');
      expect(response.body.type).toBe('transaction-response');
      expect(response.body.response.status).toBe('201');

      await labRequest.reload();
      await Promise.all(labTests.map(labTest => labTest.reload()));
      expect(labRequest.status).toBe(LAB_REQUEST_STATUSES.VERIFIED);
      labTests.forEach((labTest, index) => {
        expect(labTest.result).toBe(`Result ${index}`);
      });
    });
  });

  describe('errors', () => {
    beforeEach(async () => {
      const {
        FhirServiceRequest,
        FhirWriteLog,
        ImagingRequest,
        ImagingRequestArea,
        ImagingResult,
        LabRequest,
        LabTestPanel,
        LabTestPanelRequest,
      } = ctx.store.models;
      await FhirWriteLog.destroy({ where: {} });
      await FhirServiceRequest.destroy({ where: {} });
      await ImagingRequest.destroy({ where: {} });
      await ImagingRequestArea.destroy({ where: {} });
      await ImagingResult.destroy({ where: {} });
      await FhirServiceRequest.destroy({ where: {} });
      await ImagingRequest.destroy({ where: {} });
      await ImagingRequestArea.destroy({ where: {} });
      await LabRequest.destroy({ where: {} });
      await LabTestPanel.destroy({ where: {} });
      await LabTestPanelRequest.destroy({ where: {} });
    });

    it('will treat transactions as atomic and will not create a resource if one of the resources is invalid', async () => {
      // arrange
      const { FhirServiceRequest, ImagingRequest, ImagingResult } = ctx.store.models;
      const ir = await ImagingRequest.create(
        fake(ImagingRequest, {
          requestedById: resources.practitioner.id,
          encounterId: resources.encounter.id,
          locationId: resources.location.id,
          status: IMAGING_REQUEST_STATUS_TYPES.PENDING,
          priority: 'routine',
          requestedDate: '2022-03-04 15:30:00',
        }),
      );
      await ir.setAreas([resources.area1.id, resources.area2.id]);
      await ir.reload();
      const irMat = await FhirServiceRequest.materialiseFromUpstream(ir.id);
      await FhirServiceRequest.resolveUpstreams();
      const { labRequest } = await fakeResourcesOfFhirServiceRequestWithLabRequest(
        ctx.store.models,
        resources,
        {
          isWithPanels: true,
        },
        {
          status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
        },
      );
      const labMat = await FhirServiceRequest.materialiseFromUpstream(labRequest.id);
      await FhirServiceRequest.resolveUpstreams();

      // act
      const body = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          {
            resource: {
              resourceType: 'ImagingStudy',
              status: 'final',
              identifier: [
                {
                  system: 'http://data-dictionary.tamanu-fiji.org/ris-accession-number.html',
                  value: 'ACCESSION',
                },
              ],
              basedOn: [
                {
                  type: 'ServiceRequest',
                  reference: `ServiceRequest/${irMat.id}`,
                },
              ],
              note: [{ text: 'This is an okay note' }, { text: 'This is another note' }],
            },
            request: {
              method: 'POST',
              url: `/api/integration/fhir/mat/ImagingStudy`,
            },
          },
          {
            resource: {
              resourceType: 'DiagnosticReport',
              basedOn: [
                {
                  type: 'ServiceRequest',
                  reference: `ServiceRequest/${labMat.id}`,
                },
              ],
              status: 'invalid_status_that_does_not_exist',
              category: [
                {
                  coding: [
                    {
                      code: '108252007',
                      system: 'http://snomed.info/sct',
                    },
                  ],
                },
              ],
              code: {
                coding: [
                  {
                    system: 'http://loinc.org',
                    code: '42191-7',
                    display: 'Hepatitis Panel',
                  },
                ],
              },
            },
            request: {
              method: 'POST',
              url: `/api/integration/fhir/mat/DiagnosticReport`,
            },
          },
        ],
      };
      const response = await app.post(PATH).send(body);

      // assert
      expect(response).not.toHaveSucceeded();
      expect(response.status).toBe(400); // the request should be rejected because the diagnostic report is invalid
      const ires = await ImagingResult.findAll({
        where: { externalCode: 'ACCESSION' },
      });
      expect(ires.length).toBe(0); // no imaging result should be created because the diagnostic report is invalid

      await labRequest.reload();
      expect(labRequest.status).toBe(LAB_REQUEST_STATUSES.RESULTS_PENDING); // the lab request should not be updated because the diagnostic report is invalid
    });

    it('will throw an error if the method is not POST', async () => {
      // act
      const body = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          {
            resource: {
              resourceType: 'ImagingStudy',
              status: 'final',
              identifier: [
                {
                  system: 'http://data-dictionary.tamanu-fiji.org/ris-accession-number.html',
                  value: 'ACCESSION',
                },
              ],
              basedOn: [
                {
                  type: 'ServiceRequest',
                  reference: `ServiceRequest/1234`,
                },
              ],
              note: [{ text: 'This is an okay note' }, { text: 'This is another note' }],
            },
            request: {
              method: 'PUT',
              url: `/api/integration/fhir/mat/ImagingStudy`,
            },
          },
        ],
      };
      const response = await app.post(PATH).send(body);

      // assert
      expect(response).not.toHaveSucceeded();
      expect(response.status).toBe(400); // the request should be rejected because the method is not POST
    });

    it('will throw an error if the resource type is not found', async () => {
      // act
      const body = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          {
            resource: {
              resourceType: 'Banana',
            },
            request: {
              method: 'POST',
              url: `/api/integration/fhir/mat/Banana`,
            },
          },
        ],
      };
      const response = await app.post(PATH).send(body);

      // assert
      expect(response).not.toHaveSucceeded();
      expect(response.status).toBe(400); // the request should be rejected because the method is not POST
    });

    it('will throw an error if the resource type is not creatable', async () => {
      // act
      const body = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          {
            resource: {
              resourceType: 'Patient',
            },
            request: {
              method: 'POST',
              url: `/api/integration/fhir/mat/Patient`,
            },
          },
        ],
      };
      const response = await app.post(PATH).send(body);

      // assert
      expect(response).not.toHaveSucceeded();
      expect(response.status).toBe(400); // the request should be rejected because the method is not POST
    });

    it('will throw an error if not a transaction bundle', async () => {
      // act
      const body = {
        resourceType: 'Bundle',
        type: 'message',
      };
      const response = await app.post(PATH).send(body);

      // assert
      expect(response).not.toHaveSucceeded();
      expect(response.status).toBe(400); // the request should be rejected because the method is not POST
    });
  });
});
