import { Op } from 'sequelize';
import { fake } from '@tamanu/fake-data/fake';
import { NOTE_RECORD_TYPES } from '@tamanu/constants';
import { createTestContext } from '../utilities';

async function makeEncounterWithAssociations(models) {
  const {
    User,
    Facility,
    Department,
    Location,
    Patient,
    Encounter,
    EncounterHistory,
    Note,
    LabRequest,
    LabTestType,
    LabTest,
    ReferenceData,
  } = models;

  const examiner = await User.create(fake(User));
  const facility = await Facility.create({ ...fake(Facility) });
  const department = await Department.create({ ...fake(Department), facilityId: facility.id });
  const location = await Location.create({ ...fake(Location), facilityId: facility.id });
  const patient = await Patient.create(fake(Patient));

  const encounter = await Encounter.create({
    ...fake(Encounter),
    patientId: patient.id,
    examinerId: examiner.id,
    departmentId: department.id,
    locationId: location.id,
  });

  const history = await EncounterHistory.findOne({ where: { encounterId: encounter.id } });

  const note = await Note.create(
    fake(Note, {
      recordType: NOTE_RECORD_TYPES.ENCOUNTER,
      recordId: encounter.id,
      authorId: examiner.id,
    }),
  );

  const labTestCategory = await ReferenceData.create({
    ...fake(ReferenceData),
    type: 'labTestCategory',
  });
  const labRequest = await LabRequest.create({
    ...fake(LabRequest),
    requestedById: examiner.id,
    encounterId: encounter.id,
    labTestCategoryId: labTestCategory.id,
  });
  const labTestType = await LabTestType.create({
    ...fake(LabTestType),
    labTestCategoryId: labTestCategory.id,
  });
  const labTest = await LabTest.create({
    ...fake(LabTest),
    labTestTypeId: labTestType.id,
    labRequestId: labRequest.id,
  });

  return { encounter, history, note, labRequest, labTest };
}

describe('Encounter', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });
  beforeEach(async () => {
    await models.Encounter.truncate({ cascade: true });
  });
  afterAll(() => ctx.close());

  describe('beforeDestroy', () => {
    it('should destroy all associated records', async () => {
      const { encounter, history, note } = await makeEncounterWithAssociations(models);

      await encounter.destroy();
      await encounter.reload({ paranoid: false });
      await history.reload({ paranoid: false });
      await note.reload({ paranoid: false });

      expect(encounter.deletedAt).toBeTruthy();
      expect(history.deletedAt).toBeTruthy();
      expect(note.deletedAt).toBeTruthy();
    });

    it('should destroy associations of associations', async () => {
      const { encounter, labRequest, labTest } = await makeEncounterWithAssociations(models);

      await encounter.destroy();
      await encounter.reload({ paranoid: false });
      await labRequest.reload({ paranoid: false });
      await labTest.reload({ paranoid: false });

      expect(encounter.deletedAt).toBeTruthy();
      expect(labRequest.deletedAt).toBeTruthy();
      expect(labTest.deletedAt).toBeTruthy();
    });
  });

  describe('beforeBulkDestroy', () => {
    it('should destroy all associated records', async () => {
      const { Encounter, EncounterHistory } = models;
      const encounterIds = [];
      for (let i = 0; i < 3; i++) {
        const { encounter } = await makeEncounterWithAssociations(models);

        if (i !== 0) {
          encounterIds.push(encounter.id);
        }
      }

      await Encounter.destroy({ where: { id: { [Op.in]: encounterIds } } });

      const count = await EncounterHistory.count();
      expect(count).toBe(1);
    });

    it('should work without specifying IDs', async () => {
      const { Encounter, EncounterHistory } = models;
      const reasonForEncounter = 'A very adequate reason';
      for (let i = 0; i < 3; i++) {
        const { encounter } = await makeEncounterWithAssociations(models);

        if (i !== 0) {
          await encounter.update({ reasonForEncounter });
        }
      }

      await Encounter.destroy({ where: { reasonForEncounter } });

      const count = await EncounterHistory.count({
        where: { reasonForEncounter },
      });
      expect(count).toBe(1);
    });

    it('should destroy associations of associations', async () => {
      const { Encounter, LabTest } = models;
      const encounterIds = [];
      for (let i = 0; i < 3; i++) {
        const { encounter } = await makeEncounterWithAssociations(models);

        if (i !== 0) {
          encounterIds.push(encounter.id);
        }
      }

      await Encounter.destroy({ where: { id: { [Op.in]: encounterIds } } });

      const count = await LabTest.count();
      expect(count).toBe(1);
    });
  });
});
