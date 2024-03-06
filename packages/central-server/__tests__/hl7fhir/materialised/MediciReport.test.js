import { sub } from 'date-fns';
import { fake, chance } from '@tamanu/shared/test-helpers';
import { toDateTimeString } from '@tamanu/shared/utils/dateTime';
import {
  IMAGING_REQUEST_STATUS_TYPES,
  REFERENCE_TYPES,
  NOTE_RECORD_TYPES,
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
    for (const upstreamModel of MediciReport.upstreams) {
      await upstreamModel.destroy({ where: {} });
    }
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
      EncounterMedication,
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
      type: 'icd10',
      name: 'Diabetes',
      code: 'icd10-E11',
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
    const encounterMedication = await EncounterMedication.create({
      ...fake(EncounterMedication),
      encounterId: encounter.id,
      medicationId,
      discontinued: false,
    });

    const rootNote = await Note.create(
      fake(Note, {
        recordId: encounter.id,
        recordType: NOTE_RECORD_TYPES.ENCOUNTER,
        content: 'Root note',
        authorId: resources.practitioner.id,
        date: toDateTimeString(sub(new Date(), { days: 8 })),
      }),
    );

    return {
      encounter,
      encounterDiagnosis,
      encounterMedication,
      procedure,
      procedureType,
      rootNote,
    };
  }

  it('materialise a Medici report', async () => {
    const {
      encounter,
      encounterDiagnosis,
      encounterMedication,
      procedureType,
    } = await makeEncounter({
      encounterType: 'emergency',
    });

    const { MediciReport } = ctx.store.models;

    await MediciReport.materialiseFromUpstream(encounter.id);
    await MediciReport.resolveUpstreams();

    const mediciReport = await MediciReport.findAll();

    expect(mediciReport[0].dataValues).toMatchObject({
      patientId: resources.patient.displayId,
      firstName: resources.patient.firstName,
      lastName: resources.patient.lastName,
      dateOfBirth: resources.patient.dateOfBirth,
      sex: resources.patient.sex,
      patientBillingId: null,
      patientBillingType: null,
      encounterId: encounter.id,
      age: 31,
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
          location: `${resources.locationGroup.name}, ${resources.location.name}`,
        },
      ],
      reasonForEncounter: encounter.reasonForEncounter,
      diagnoses: [
        {
          certainty: encounterDiagnosis.certainty,
          code: 'icd10-E11',
          isPrimary: false,
          name: 'Diabetes',
        },
      ],
      medications: [
        {
          discontinued: false,
          discontinuedDate: encounterMedication.discontinuedDate,
          discontinuingReason: encounterMedication.discontinuingReason,
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
              name: 'AgRDT Negative, no further testing needed',
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

      const mediciReport = await MediciReport.findAll();

      expect(mediciReport[0].dataValues).toMatchObject({
        notes: [
          {
            content: rootNote.content,
            noteType: rootNote.noteType,
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
        }),
      );

      const { MediciReport } = ctx.store.models;

      await MediciReport.materialiseFromUpstream(encounter.id);
      await MediciReport.resolveUpstreams();

      const mediciReport = await MediciReport.findAll();

      expect(mediciReport[0].dataValues).toMatchObject({
        notes: [
          {
            content: changelog1.content,
            noteType: changelog1.noteType,
            revisedById: changelog1.revisedById,
          },
        ],
      });
    });
  });
});
