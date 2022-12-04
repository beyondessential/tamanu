import { fake, fakeReferenceData, showError } from 'shared/test-helpers';
import { IMAGING_REQUEST_STATUS_TYPES } from 'shared/constants';

import { createTestContext } from '../../utilities';

const INTEGRATION_ROUTE = 'fhir/mat';

describe(`Materialised FHIR - Observation`, () => {
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

    resources = {
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

  describe('create', () => {
    const PATH = `/v1/integration/${INTEGRATION_ROUTE}/Observation`;

    let encounter;
    beforeEach(async () => {
      const { Encounter, FhirServiceRequest, ImagingRequest, ImagingRequestArea, ImagingResult } = ctx.store.models;
      await FhirServiceRequest.destroy({ where: {} });
      await ImagingRequest.destroy({ where: {} });
      await ImagingRequestArea.destroy({ where: {} });
      await ImagingResult.destroy({ where: {} });
      
      encounter = await Encounter.create(
        fake(Encounter, {
          patientId: resources.patient.id,
          locationId: resources.location.id,
          departmentId: resources.department.id,
          examinerId: resources.practitioner.id,
        }),
      );
    });

    it('creates a result from an observation', () => showError(async () => {
      // arrange
      const { FhirServiceRequest, ImagingRequest, ImagingResult } = ctx.store.models;
      const ir = await ImagingRequest.create(
        fake(ImagingRequest, {
          requestedById: resources.practitioner.id,
          encounterId: encounter.id,
          locationId: resources.location.id,
          status: IMAGING_REQUEST_STATUS_TYPES.PENDING,
          priority: 'normal',
          requestedDate: '2022-03-04 15:30:00',
        }),
      );
      await ir.setAreas([resources.area1.id, resources.area2.id]);
      await ir.reload();
      const mat = await FhirServiceRequest.materialiseFromUpstream(ir.id);
      await FhirServiceRequest.resolveUpstreams();

      // act
      const response = await app.post(PATH).send({
        resourceType: 'Observation',
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
            identifier: {
              system: 'http://data-dictionary.tamanu-fiji.org/tamanu-mrid-imagingrequest.html',
              value: mat.id,
            },
          },
        ],
        note: [{ text: 'This is a note' }, { text: 'This is another note' }],
      });

      // assert
      expect(response).toHaveSucceeded();
      expect(response.status).toBe(201);
      const ires = await ImagingResult.findOne({
        where: { externalCode: 'ACCESSION' },
      });
      expect(ires).toBeTruthy();
      expect(ires.description).toEqual('This is a note\n\nThis is another note');
    }));

    it('updates a result from an observation', () => showError(async () => {
      // arrange
      const { FhirServiceRequest, ImagingRequest, ImagingResult } = ctx.store.models;
      const ir = await ImagingRequest.create(
        fake(ImagingRequest, {
          requestedById: resources.practitioner.id,
          encounterId: encounter.id,
          locationId: resources.location.id,
          status: IMAGING_REQUEST_STATUS_TYPES.PENDING,
          priority: 'normal',
          requestedDate: '2022-03-04 15:30:00',
        }),
      );
      await ir.setAreas([resources.area1.id, resources.area2.id]);
      await ir.reload();
      const mat = await FhirServiceRequest.materialiseFromUpstream(ir.id);
      await FhirServiceRequest.resolveUpstreams();
      
      const ires = await ImagingResult.create(fake(ImagingResult, {
        imagingRequestId: ir.id,
        externalCode: 'ACCESSION',
      }));

      // act
      const response = await app.post(PATH).send({
        resourceType: 'Observation',
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
            identifier: {
              system: 'http://data-dictionary.tamanu-fiji.org/tamanu-mrid-imagingrequest.html',
              value: mat.id,
            },
          },
        ],
        note: [{ text: 'This is a note' }, { text: 'This is another note' }],
      });

      // assert
      expect(response).toHaveSucceeded();
      expect(response.status).toBe(201);
      await ires.reload();
      expect(ires.description).toEqual('This is a note\n\nThis is another note');
    }));
  });

  describe('errors', () => {
    it.todo('returns invalid if the resourceType does not match');
    it.todo('returns invalid if the status is not final');
    it.todo('returns invalid if the service request id is missing');
    it.todo('returns invalid if the service request cannot be found');
  });
});
