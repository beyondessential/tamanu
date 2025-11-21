import { sub } from 'date-fns';
import { chance, fake } from '@tamanu/fake-data/fake';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import {
  IMAGING_REQUEST_STATUS_TYPES,
  REFERENCE_TYPES,
  NOTE_RECORD_TYPES,
  NOTE_TYPES,
} from '@tamanu/constants';

import { createTestContext } from '../../utilities';

describe(`Materialised - MediciReport`, () => {
  let ctx;
  let resources;

  beforeAll(async () => {
    ctx = await createTestContext();

    const { Department, Facility, Location, LocationGroup, Patient, User } = ctx.store.models;

    const [practitioner, patient, facility] = await Promise.all([
      User.create(fake(User)),
      Patient.create(
        fake(Patient, {
          dateOfBirth: '1993-01-01',
        }),
      ),
      Facility.create(fake(Facility)),
    ]);

    const locationGroup = await LocationGroup.create(
      fake(LocationGroup, { facilityId: facility.id }),
    );

    const location = await Location.create(
      fake(Location, { facilityId: facility.id, locationGroupId: locationGroup.id }),
    );

    const department = await Department.create(
      fake(Department, { facilityId: facility.id, locationId: location.id }),
    );

    resources = {
      department,
      practitioner,
      patient,
      facility,
      location,
      locationGroup,
    };
  });

  beforeEach(async () => {
    const { MediciReport } = ctx.store.models;
    await MediciReport.destroy({ where: {} });
  });

  afterAll(() => ctx.close());

  async function makeEncounter(overrides = {}) {
    const {
      Encounter,
      LabRequest,
      LabTestType,
      LabTest,
      ReferenceData,
      ImagingRequest,
      Procedure,
      EncounterDiagnosis,
      Prescription,
      EncounterPrescription,
      Note,
    } = ctx.store.models;

    const startDate = '2023-11-11 00:00:00';
    const endDate = '2023-11-12 00:00:00';

    const encounter = await Encounter.create(
      fake(Encounter, {
        patientId: resources.patient.id,
        locationId: resources.location.id,
        departmentId: resources.department.id,
        examinerId: resources.practitioner.id,
        startDate,
        endDate,
        ...overrides,
      }),
    );

    // ===== Lab requests ======
    const laboratory = await ReferenceData.create({
      ...fake(ReferenceData),
      type: 'labTestLaboratory',
    });
    const labTestCategory = await ReferenceData.create({
      ...fake(ReferenceData),
      type: 'labTestCategory',
    });
    const labRequest = await LabRequest.create({
      ...fake(LabRequest),
      encounterId: encounter.id,
      labTestLaboratoryId: laboratory.id,
      labTestCategoryId: labTestCategory.id,
      status: 'published',
    });
    const labTestType = await LabTestType.create({
      ...fake(LabTestType),
      labTestCategoryId: labTestCategory.id,
      name: chance.pickone(['AgRDT Negative, no further testing needed', 'AgRDT Positive']),
    });
    const labTestMethod = await ReferenceData.create({
      ...fake(ReferenceData),
      type: 'labTestMethod',
      code: 'RDT',
    });
    await LabTest.create({
      ...fake(LabTest),
      labTestTypeId: labTestType.id,
      labRequestId: labRequest.id,
      labTestMethodId: labTestMethod.id,
      categoryId: labTestCategory.id,
      result: 'Inconclusive',
    });
    // ==================

    await ImagingRequest.create(
      fake(ImagingRequest, {
        requestedById: resources.practitioner.id,
        encounterId: encounter.id,
        locationId: resources.location.id,
        status: IMAGING_REQUEST_STATUS_TYPES.PENDING,
        priority: 'routine',
        requestedDate: '2022-03-04 15:30:00',
        imagingType: 'vascularStudy',
      }),
    );

    const procedureType = await ReferenceData.create(
      fake(ReferenceData, {
        type: REFERENCE_TYPES.PROCEDURE_TYPE,
        name: 'Glucose (hypertonic) 5%',
      }),
    );
    const procedure = await Procedure.create({
      ...fake(Procedure),
      encounterId: encounter.id,
      locationId: resources.location.id,
      procedureTypeId: procedureType.id,
    });

    const diagnosis = await ReferenceData.create({
      type: 'diagnosis',
      name: 'Diabetes',
      code: 'diagnosis-E11',
    });
    const encounterDiagnosis = await EncounterDiagnosis.create({
      ...fake(EncounterDiagnosis),
      isPrimary: false,
      encounterId: encounter.id,
      diagnosisId: diagnosis.id,
    });

    const { id: medicationId } = await ReferenceData.create(
      fake(ReferenceData, { type: REFERENCE_TYPES.DRUG, name: 'Glucose (hypertonic) 5%' }),
    );
    const prescription = await Prescription.create({
      ...fake(Prescription),
      medicationId,
      discontinued: false,
    });

    await EncounterPrescription.create({
      ...fake(EncounterPrescription),
      encounterId: encounter.id,
      prescriptionId: prescription.id,
    });

    const rootNote = await Note.create(
      fake(Note, {
        recordId: encounter.id,
        recordType: NOTE_RECORD_TYPES.ENCOUNTER,
        content: 'Root note',
        authorId: resources.practitioner.id,
        date: toDateTimeString(sub(new Date(), { days: 8 })),
        noteTypeId: NOTE_TYPES.OTHER,
      }),
    );

    return {
      encounter,
      encounterDiagnosis,
      prescription,
      procedure,
      procedureType,
      rootNote,
      labTestType,
    };
  }

  it('materialise a Medici report', async () => {
    const { encounter, encounterDiagnosis, prescription, procedureType, labTestType } =
      await makeEncounter({
        encounterType: 'emergency',
      });

    const { MediciReport } = ctx.store.models;

    await MediciReport.materialiseFromUpstream(encounter.id);
    await MediciReport.resolveUpstreams();

    const mediciReport = await MediciReport.findOne();

    expect(mediciReport.dataValues).toMatchObject({
      patientId: resources.patient.displayId,
      firstName: resources.patient.firstName,
      lastName: resources.patient.lastName,
      dateOfBirth: resources.patient.dateOfBirth,
      sex: resources.patient.sex,
      patientBillingId: null,
      patientBillingType: null,
      encounterId: encounter.id,
      age: expect.any(Number), // age will change every year
      weight: null,
      visitType: 'Emergency short stay',
      episodeEndStatus: null,
      waitTime: null,
      departments: [
        {
          department: resources.department.name,
        },
      ],
      locations: [
        {
          location: resources.location.name,
          locationGroup: resources.locationGroup.name,
          facility: resources.facility.name,
        },
      ],
      reasonForEncounter: encounter.reasonForEncounter,
      diagnoses: [
        {
          certainty: encounterDiagnosis.certainty,
          code: 'diagnosis-E11',
          isPrimary: false,
          name: 'Diabetes',
        },
      ],
      medications: [
        {
          discontinued: false,
          discontinuedDate: prescription.discontinuedDate,
          discontinuingReason: prescription.discontinuingReason,
          name: 'Glucose (hypertonic) 5%',
        },
      ],
      vaccinations: null,
      procedures: [
        {
          code: procedureType.code,
          location: resources.location.name,
          name: procedureType.name,
        },
      ],
      imagingRequests: [
        {
          areasToBeImaged: null,
          name: 'vascularStudy',
        },
      ],
      labRequests: [
        {
          tests: [
            {
              name: labTestType.name,
            },
          ],
        },
      ],
    });
  });

  describe('materialise Notes in Medici Report', () => {
    it('returns root encounter note if it has not been edited', async () => {
      const { encounter, rootNote } = await makeEncounter({
        encounterType: 'emergency',
      });

      const { MediciReport } = ctx.store.models;

      await MediciReport.materialiseFromUpstream(encounter.id);
      await MediciReport.resolveUpstreams();

      const mediciReport = await MediciReport.findOne();

      expect(mediciReport.dataValues).toMatchObject({
        notes: [
          {
            content: rootNote.content,
            noteTypeId: rootNote.noteTypeId,
            revisedById: rootNote.id,
          },
        ],
      });
    });

    it('returns latest encounter note if it has been edited', async () => {
      const { Note } = ctx.store.models;
      const { encounter, rootNote } = await makeEncounter({
        encounterType: 'emergency',
      });

      const changelog1 = await Note.create(
        fake(Note, {
          recordId: encounter.id,
          recordType: NOTE_RECORD_TYPES.ENCOUNTER,
          content: 'Changelog1',
          authorId: resources.practitioner.id,
          date: toDateTimeString(sub(new Date(), { days: 6 })),
          revisedById: rootNote.id,
          noteTypeId: NOTE_TYPES.OTHER,
        }),
      );

      const { MediciReport } = ctx.store.models;

      await MediciReport.materialiseFromUpstream(encounter.id);
      await MediciReport.resolveUpstreams();

      const mediciReport = await MediciReport.findOne();

      expect(mediciReport.dataValues).toMatchObject({
        notes: [
          {
            content: changelog1.content,
            noteTypeId: changelog1.noteTypeId,
            revisedById: changelog1.revisedById,
          },
        ],
      });
    });
  });

  describe('materialise Location History in Medici Report', () => {
    it('returns all locations for an encounter', async () => {
      const { Location } = ctx.store.models;
      const oldLocation = await Location.create(
        fake(Location, {
          facilityId: resources.facility.id,
          locationGroupId: resources.locationGroup.id,
        }),
      );
      const newLocation = await Location.create(
        fake(Location, {
          facilityId: resources.facility.id,
          locationGroupId: resources.locationGroup.id,
        }),
      );

      const { encounter } = await makeEncounter({
        encounterType: 'emergency',
        locationId: oldLocation.id,
      });

      await encounter.update({ locationId: newLocation.id });

      const { MediciReport } = ctx.store.models;

      await MediciReport.materialiseFromUpstream(encounter.id);
      await MediciReport.resolveUpstreams();

      const mediciReport = await MediciReport.findOne();

      expect(mediciReport.dataValues).toMatchObject({
        locations: [
          {
            facility: resources.facility.name,
            location: oldLocation.name,
            locationGroup: resources.locationGroup.name,
          },
          {
            facility: resources.facility.name,
            location: newLocation.name,
            locationGroup: resources.locationGroup.name,
          },
        ],
      });
    });
  });

  describe('materialise Department History in Medici Report', () => {
    it('returns all departments for an encounter', async () => {
      const { Department } = ctx.store.models;
      const oldDepartment = await Department.create(
        fake(Department, {
          facilityId: resources.facility.id,
          locationId: resources.location.id,
        }),
      );
      const newDepartment = await Department.create(
        fake(Department, {
          facilityId: resources.facility.id,
          locationId: resources.location.id,
        }),
      );

      const { encounter } = await makeEncounter({
        encounterType: 'emergency',
        departmentId: oldDepartment.id,
      });

      await encounter.update({ departmentId: newDepartment.id });

      const { MediciReport } = ctx.store.models;

      await MediciReport.materialiseFromUpstream(encounter.id);
      await MediciReport.resolveUpstreams();

      const mediciReport = await MediciReport.findOne();

      expect(mediciReport.dataValues).toMatchObject({
        departments: [
          {
            department: oldDepartment.name,
          },
          {
            department: newDepartment.name,
          },
        ],
      });
    });
  });
});
