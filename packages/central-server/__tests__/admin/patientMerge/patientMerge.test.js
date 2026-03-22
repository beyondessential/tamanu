import { fake, fakeUser } from '@tamanu/fake-data/fake';
import {
  getTablesWithNoMergeCoverage,
  mergePatient,
} from '../../../dist/admin/patientMerge/mergePatient';
import { createTestContext } from '../../utilities';
import { InvalidParameterError } from '@tamanu/errors';
import { NOTE_TYPES } from '@tamanu/constants/notes';
import { Op } from 'sequelize';
import { PATIENT_FIELD_DEFINITION_TYPES } from '@tamanu/constants/patientFields';
import { PatientMergeMaintainer } from '../../../dist/tasks/PatientMergeMaintainer';
import { PORTAL_USER_STATUSES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants/facts';

import { makeTwoPatients } from './makeTwoPatients';

describe('Patient merge', () => {
  let ctx;
  let models;
  let baseApp;
  let adminApp;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    adminApp = await baseApp.asRole('admin');
  });

  afterEach(async () => {
    await models.PatientFacility.truncate();
  });

  afterAll(async () => {
    await ctx.close();
  });

  it("Should make a fuss if any models with a patientId aren't covered", async () => {
    // If this test is breaking your CI after adding a new model, you need to add it
    // to the simpleUpdateModels array over in mergePatient.js (unless it isn't
    // trivial to merge, in which case, thank goodness this caught you)
    const tables = await getTablesWithNoMergeCoverage(models);
    expect(tables).toHaveLength(0);
  });

  it('Should merge a patient with no additional records', async () => {
    const [keep, merge] = await makeTwoPatients(models);

    const { updates } = await mergePatient(models, keep.id, merge.id);
    expect(updates).toEqual({
      Patient: 2,
    });

    await keep.reload({ paranoid: false });
    await merge.reload({ paranoid: false });
    expect(keep).toHaveProperty('mergedIntoId', null);
    expect(keep).toHaveProperty('deletedAt', null);
    expect(merge).toHaveProperty('mergedIntoId', keep.id);
    expect(merge).toHaveProperty('visibilityStatus', VISIBILITY_STATUSES.MERGED);
    expect(merge.deletedAt).toBeTruthy();
  });

  it('Should merge encounters across', async () => {
    const { Encounter, Facility, Department, Location, User } = models;

    const [keep, merge] = await makeTwoPatients(models);

    const facility = await Facility.create({
      ...fake(Facility),
      name: 'Utopia HQ',
    });

    const location = await Location.create({
      ...fake(Location),
      facilityId: facility.id,
    });

    const department = await Department.create({
      ...fake(Department),
      facilityId: facility.id,
    });

    const examiner = await User.create(fakeUser());

    const baseEncounter = {
      locationId: location.id,
      departmentId: department.id,
      examinerId: examiner.id,
    };

    const mergeEnc = await models.Encounter.create({
      ...fake(Encounter),
      ...baseEncounter,
      patientId: merge.id,
    });
    const mergeEnc2 = await models.Encounter.create({
      ...fake(Encounter),
      ...baseEncounter,
      patientId: merge.id,
    });
    const keepEnc = await models.Encounter.create({
      ...fake(Encounter),
      ...baseEncounter,
      patientId: keep.id,
    });

    const { updates } = await mergePatient(models, keep.id, merge.id);

    expect(updates).toEqual({
      Patient: 2,
      Encounter: 2,
      PatientFacility: 1,
    });

    for (const e of [mergeEnc, mergeEnc2, keepEnc]) {
      await e.reload();
      expect(e).toHaveProperty('patientId', keep.id);
    }

    expect(await keep.getEncounters()).toHaveLength(3);
    expect(await merge.getEncounters()).toHaveLength(0);
  });

  it('Should merge a patient with some extra records', async () => {
    const [keep, merge] = await makeTwoPatients(models);
    const allergy = await models.PatientAllergy.create({
      ...fake(models.PatientAllergy),
      patientId: merge.id,
    });

    const issue = await models.PatientIssue.create({
      ...fake(models.PatientIssue),
      patientId: merge.id,
    });

    const { updates } = await mergePatient(models, keep.id, merge.id);

    expect(updates).toEqual({
      Patient: 2,
      PatientAllergy: 1,
      PatientIssue: 1,
    });

    await allergy.reload();
    expect(allergy).toHaveProperty('patientId', keep.id);
    await issue.reload();
    expect(issue).toHaveProperty('patientId', keep.id);
  });

  it('Should throw if the keep patient and merge patient are the same', async () => {
    const { Patient } = models;
    const keep = await Patient.create(fake(Patient));
    await expect(() => mergePatient(models, keep.id, keep.id)).rejects.toThrow(
      InvalidParameterError,
    );
  });

  it("Should throw if the keep patient doesn't exist", async () => {
    const { Patient } = models;
    const keep = await Patient.create(fake(Patient));
    await expect(() => mergePatient(models, keep.id, 'not real')).rejects.toThrow(
      InvalidParameterError,
    );
  });

  it("Should throw if the merge patient doesn't exist", async () => {
    const { Patient } = models;
    const merge = await Patient.create(fake(Patient));
    await expect(() => mergePatient(models, 'not real', merge.id)).rejects.toThrow(
      InvalidParameterError,
    );
  });

  it('Should merge a page of notes across', async () => {
    const [keep, merge] = await makeTwoPatients(models);

    const note = await merge.createNote({
      noteTypeId: NOTE_TYPES.OTHER,
    });

    const { updates } = await mergePatient(models, keep.id, merge.id);
    expect(updates).toEqual({
      Patient: 2,
      Note: 1,
    });
    await note.reload();
    expect(note.recordId).toEqual(keep.id);
  });

  describe('Patient', () => {
    it('Should preserve fields and grab missing fields', async () => {
      const [keep, merge] = await makeTwoPatients(models, { middleName: '', culturalName: null });
      const mergedFirstName = merge.firstName;
      const mergeMiddleName = merge.middleName;
      const mergeCulturalName = merge.culturalName;

      await mergePatient(models, keep.id, merge.id);
      await keep.reload({ paranoid: false });

      expect(keep.firstName).not.toBe(mergedFirstName);
      expect(keep).toHaveProperty('middleName', mergeMiddleName);
      expect(keep).toHaveProperty('culturalName', mergeCulturalName);
    });
  });

  describe('PatientAdditionalData', () => {
    it('Should update keep patient PAD with merged info and delete merge patient PAD', async () => {
      const { PatientAdditionalData } = models;
      const [keep, merge] = await makeTwoPatients(models);
      const oldKeepPatientPad = await PatientAdditionalData.create({
        patientId: keep.id,
        passport: 'keep-passport',
      });
      await PatientAdditionalData.create({
        patientId: merge.id,
        primaryContactNumber: 'merge-phone',
      });
      const oldKeepPatientPadCreatedAt = oldKeepPatientPad.createdAt;

      const { updates } = await mergePatient(models, keep.id, merge.id);
      expect(updates).toEqual({
        Patient: 2,
        PatientAdditionalData: 1,
      });

      const newKeepPatientPad = await PatientAdditionalData.findOne({
        where: { patientId: keep.id },
        paranoid: false,
      });
      const newMergePatientPad = await PatientAdditionalData.findOne({
        where: { patientId: merge.id },
        paranoid: false,
      });

      expect(newMergePatientPad).toBeTruthy();
      expect(newMergePatientPad.deletedAt).toBeTruthy();
      expect(newKeepPatientPad.createdAt).toEqual(oldKeepPatientPadCreatedAt);
      expect(newKeepPatientPad.deletedAt).toBeNull();
    });

    it('Should merge patient additional data cleanly', async () => {
      const { PatientAdditionalData } = models;
      const [keep, merge] = await makeTwoPatients(models);

      await PatientAdditionalData.create({
        patientId: keep.id,
        passport: 'keep-passport',
      });

      await PatientAdditionalData.create({
        patientId: merge.id,
        primaryContactNumber: 'merge-phone',
      });

      await mergePatient(models, keep.id, merge.id);

      const newKeepPatientPad = await PatientAdditionalData.findOne({
        where: { patientId: keep.id },
        paranoid: false,
      });

      expect(newKeepPatientPad).toHaveProperty('passport', 'keep-passport');
      expect(newKeepPatientPad).toHaveProperty('primaryContactNumber', 'merge-phone');
    });

    it('Should merge patient additional data even if the keep patient PAD is null', async () => {
      const { PatientAdditionalData } = models;
      const [keep, merge] = await makeTwoPatients(models);

      await PatientAdditionalData.create({
        patientId: keep.id,
      });

      await PatientAdditionalData.create({
        patientId: merge.id,
        primaryContactNumber: 'merge-phone',
      });

      await mergePatient(models, keep.id, merge.id);

      const newKeepPatientPad = await PatientAdditionalData.findOne({
        where: { patientId: keep.id },
        paranoid: false,
      });

      expect(newKeepPatientPad).toHaveProperty('primaryContactNumber', 'merge-phone');
      expect(newKeepPatientPad).toHaveProperty('patientId', keep.id);
    });

    it('Should keep data from the keep patient and fill unknown values from merge patient', async () => {
      const { PatientAdditionalData } = models;
      const [keep, merge] = await makeTwoPatients(models);

      await PatientAdditionalData.create({
        patientId: keep.id,
        passport: 'keep-passport',
        primaryContactNumber: 'keep-primary-phone',
        emergencyContactNumber: '',
      });

      await PatientAdditionalData.create({
        patientId: merge.id,
        primaryContactNumber: 'merge-primary-phone',
        secondaryContactNumber: 'merge-secondary-phone',
        emergencyContactNumber: 'merge-emergency-phone',
      });

      await mergePatient(models, keep.id, merge.id);

      const newKeepPatientPad = await PatientAdditionalData.findOne({
        where: { patientId: keep.id },
        paranoid: false,
      });

      expect(newKeepPatientPad).toHaveProperty('passport', 'keep-passport');
      expect(newKeepPatientPad).toHaveProperty('primaryContactNumber', 'keep-primary-phone');
      expect(newKeepPatientPad).toHaveProperty('secondaryContactNumber', 'merge-secondary-phone');
      expect(newKeepPatientPad).toHaveProperty('emergencyContactNumber', 'merge-emergency-phone');
    });

    it('Should NOT use sync merge logic', async () => {
      const { PatientAdditionalData, LocalSystemFact } = models;
      const [keep, merge] = await makeTwoPatients(models);
      await PatientAdditionalData.create({
        patientId: keep.id,
        passport: 'keep-passport',
      });

      // Manually update currentSyncTick to fake sync behavior
      const systemFact = await LocalSystemFact.findOne({ where: { key: 'currentSyncTick' } });
      await systemFact.update({ value: 2 });

      // Create merge PAD second, so it would be preferred under sync logic (but NOT under merge logic)
      await PatientAdditionalData.create({
        patientId: merge.id,
        passport: 'merge-passport',
      });

      await mergePatient(models, keep.id, merge.id);
      const newKeepPatientPad = await PatientAdditionalData.findOne({
        where: { patientId: keep.id },
        paranoid: false,
      });
      expect(newKeepPatientPad).toHaveProperty('passport', 'keep-passport');
    });
  });

  describe('PatientBirthData', () => {
    it('Should update keep patient birth data with merged info and delete merge patient birth data', async () => {
      const { PatientBirthData } = models;
      const [keep, merge] = await makeTwoPatients(models);
      const oldKeepPatientBirthData = await PatientBirthData.create({
        patientId: keep.id,
        birthWeight: 5,
      });
      await PatientBirthData.create({
        patientId: merge.id,
        birthWeight: 7,
      });
      const oldKeepPatientBirthDataCreatedAt = oldKeepPatientBirthData.createdAt;

      const { updates } = await mergePatient(models, keep.id, merge.id);
      expect(updates).toEqual({
        Patient: 2,
        PatientBirthData: 1,
      });

      const newKeepPatientBirthData = await PatientBirthData.findOne({
        where: { patientId: keep.id },
        paranoid: false,
      });
      const newMergePatientBirthData = await PatientBirthData.findOne({
        where: { patientId: merge.id },
        paranoid: false,
      });

      expect(newMergePatientBirthData).toBeTruthy();
      expect(newMergePatientBirthData.deletedAt).toBeTruthy();
      expect(newKeepPatientBirthData.createdAt).toEqual(oldKeepPatientBirthDataCreatedAt);
      expect(newKeepPatientBirthData.deletedAt).toBeNull();
    });

    it('merges Patient Birth Data cleanly', async () => {
      const { PatientBirthData } = models;
      const [keep, merge] = await makeTwoPatients(models);

      const keepPatientBirthData = await PatientBirthData.create({
        patientId: keep.id,
        birthWeight: 5,
      });

      const mergePatientBirthData = await PatientBirthData.create({
        patientId: merge.id,
        birthLength: 6,
      });

      await mergePatient(models, keep.id, merge.id);

      const newKeepPatientBirthData = await PatientBirthData.findOne({
        where: { patientId: keep.id },
        paranoid: false,
      });

      expect(newKeepPatientBirthData).toHaveProperty(
        'birthWeight',
        keepPatientBirthData.birthWeight,
      );
      expect(newKeepPatientBirthData).toHaveProperty(
        'birthLength',
        mergePatientBirthData.birthLength,
      );
    });

    it('merges Patient Birth Data even if the keep Patient Birth Data is null', async () => {
      const { PatientBirthData } = models;
      const [keep, merge] = await makeTwoPatients(models);

      await PatientBirthData.create({
        patientId: keep.id,
      });

      const mergePatientBirthData = await PatientBirthData.create({
        patientId: merge.id,
        birthWeight: 5,
      });

      await mergePatient(models, keep.id, merge.id);

      const newKeepPatientBirthData = await PatientBirthData.findOne({
        where: { patientId: keep.id },
        paranoid: false,
      });

      expect(newKeepPatientBirthData).toHaveProperty(
        'birthWeight',
        mergePatientBirthData.birthWeight,
      );
      expect(newKeepPatientBirthData).toHaveProperty('patientId', keep.id);
    });

    it('keeps Patient Birth Data from the keep patient and fill unknown values from merge patient', async () => {
      const { PatientBirthData } = models;
      const [keep, merge] = await makeTwoPatients(models);

      const keepPatientBirthData = await PatientBirthData.create({
        patientId: keep.id,
        birthWeight: 3,
        birthLength: 20,
        gestationalAgeEstimate: 6,
      });

      const mergePatientBirthData = await PatientBirthData.create({
        patientId: merge.id,
        birthWeight: 4,
        apgarScoreOneMinute: 3,
        apgarScoreFiveMinutes: 4,
        apgarScoreTenMinutes: 5,
      });

      await mergePatient(models, keep.id, merge.id);

      const newKeepPatientBirthData = await PatientBirthData.findOne({
        where: { patientId: keep.id },
        paranoid: false,
      });

      expect(newKeepPatientBirthData).toHaveProperty(
        'birthWeight',
        keepPatientBirthData.birthWeight,
      );
      expect(newKeepPatientBirthData).toHaveProperty(
        'apgarScoreOneMinute',
        mergePatientBirthData.apgarScoreOneMinute,
      );
      expect(newKeepPatientBirthData).toHaveProperty(
        'apgarScoreFiveMinutes',
        mergePatientBirthData.apgarScoreFiveMinutes,
      );
      expect(newKeepPatientBirthData).toHaveProperty(
        'apgarScoreTenMinutes',
        mergePatientBirthData.apgarScoreTenMinutes,
      );
    });
  });

  describe('PatientDeathData', () => {
    it('appends PatientDeathData of merged patient into keep patient WITHOUT death record, and switch the status to MERGED', async () => {
      const { PatientDeathData, User } = models;
      const [keep, merge] = await makeTwoPatients(models);
      const clinician = await User.create(fakeUser());

      const oldMergePatientDeathData = await PatientDeathData.create({
        patientId: merge.id,
        clinicianId: clinician.id,
        carrierAge: 25,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      const { updates } = await mergePatient(models, keep.id, merge.id);
      expect(updates).toEqual({
        Patient: 2,
        PatientDeathData: 1,
      });

      const keepPatientDeathDataRows = await PatientDeathData.findAll({
        where: { patientId: keep.id },
        paranoid: false,
      });
      const newMergePatientDeathData = await PatientDeathData.findOne({
        where: { id: oldMergePatientDeathData.id },
        paranoid: false,
      });

      expect(keepPatientDeathDataRows).toHaveLength(1);
      expect(newMergePatientDeathData).toHaveProperty(
        'visibilityStatus',
        VISIBILITY_STATUSES.MERGED,
      );
    });

    it('appends PatientDeathData of merged patient into keep patient WITH death record, and switch the status to MERGED', async () => {
      const { PatientDeathData, User } = models;
      const [keep, merge] = await makeTwoPatients(models);
      const clinician = await User.create(fakeUser());

      await PatientDeathData.create({
        patientId: keep.id,
        clinicianId: clinician.id,
        carrierAge: 27,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });
      const oldMergePatientDeathData = await PatientDeathData.create({
        patientId: merge.id,
        clinicianId: clinician.id,
        carrierAge: 25,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      const { updates } = await mergePatient(models, keep.id, merge.id);
      expect(updates).toEqual({
        Patient: 2,
        PatientDeathData: 1,
      });

      const keepPatientDeathDataRows = await PatientDeathData.findAll({
        where: { patientId: keep.id },
        paranoid: false,
      });
      const newMergePatientDeathData = await PatientDeathData.findOne({
        where: { id: oldMergePatientDeathData.id },
        paranoid: false,
      });

      expect(keepPatientDeathDataRows).toHaveLength(2);
      expect(newMergePatientDeathData).toHaveProperty(
        'visibilityStatus',
        VISIBILITY_STATUSES.MERGED,
      );
    });

    it('append HISTORICAL and MERGED PatientDeathData into keep patient', async () => {
      const { PatientDeathData, User } = models;
      const [keep, merge] = await makeTwoPatients(models);

      const clinician = await User.create(fakeUser());

      // keep patient historical data
      await PatientDeathData.create({
        patientId: keep.id,
        clinicianId: clinician.id,
        carrierAge: 27,
        visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
      });

      // merged patient historical data 1
      await PatientDeathData.create({
        patientId: merge.id,
        clinicianId: clinician.id,
        carrierAge: 25,
        visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
      });

      // merged patient historical merged data 2
      await PatientDeathData.create({
        patientId: merge.id,
        clinicianId: clinician.id,
        carrierAge: 29,
        visibilityStatus: VISIBILITY_STATUSES.MERGED,
      });

      const { updates } = await mergePatient(models, keep.id, merge.id);
      expect(updates).toEqual({
        Patient: 2,
        PatientDeathData: 2,
      });

      const newKeepPatientDeathDataRows = await PatientDeathData.findAll({
        where: {
          patientId: keep.id,
          visibilityStatus: { [Op.not]: VISIBILITY_STATUSES.CURRENT },
        },
        paranoid: false,
      });

      expect(newKeepPatientDeathDataRows).toHaveLength(3);
    });
  });

  describe('PatientFieldValue', () => {
    it('Merge patient field values', async () => {
      const { PatientFieldDefinitionCategory, PatientFieldDefinition, PatientFieldValue } = models;

      const category = await PatientFieldDefinitionCategory.create(
        fake(PatientFieldDefinitionCategory),
      );
      const definitionA = await PatientFieldDefinition.create({
        categoryId: category.id,
        name: 'Secret Identity',
        fieldType: PATIENT_FIELD_DEFINITION_TYPES.STRING,
      });
      const definitionB = await PatientFieldDefinition.create({
        categoryId: category.id,
        name: 'Alter Ego',
        fieldType: PATIENT_FIELD_DEFINITION_TYPES.STRING,
      });
      const definitionC = await PatientFieldDefinition.create({
        categoryId: category.id,
        name: 'Avatar name',
        fieldType: PATIENT_FIELD_DEFINITION_TYPES.STRING,
      });

      const [keep, merge] = await makeTwoPatients(models);
      const testValuesObject = {
        [definitionA.id]: {
          merge: 'Dick Grayson',
          keep: 'Jason Todd',
          expect: 'Jason Todd',
        },
        // Copies values if keep patient has empty string
        [definitionB.id]: {
          merge: 'Robin',
          keep: '',
          expect: 'Robin',
        },
        // Creates value if keep patient didn't had any record
        [definitionC.id]: {
          merge: 'Nightwing',
          expect: 'Nightwing',
        },
      };

      await PatientFieldValue.create({
        patientId: merge.id,
        definitionId: definitionA.id,
        value: testValuesObject[definitionA.id].merge,
      });
      await PatientFieldValue.create({
        patientId: keep.id,
        definitionId: definitionA.id,
        value: testValuesObject[definitionA.id].keep,
      });
      await PatientFieldValue.create({
        patientId: merge.id,
        definitionId: definitionB.id,
        value: testValuesObject[definitionB.id].merge,
      });
      await PatientFieldValue.create({
        patientId: keep.id,
        definitionId: definitionB.id,
        value: testValuesObject[definitionB.id].keep,
      });
      await PatientFieldValue.create({
        patientId: merge.id,
        definitionId: definitionC.id,
        value: testValuesObject[definitionC.id].merge,
      });

      const { updates } = await mergePatient(models, keep.id, merge.id);
      expect(updates).toEqual({
        Patient: 2,
        PatientFieldValue: 2,
      });

      const updatedFieldValues = await PatientFieldValue.findAll({});
      expect(updatedFieldValues.length).toEqual(3);
      updatedFieldValues.forEach(fieldValue => {
        expect(fieldValue.value).toEqual(testValuesObject[fieldValue.definitionId].expect);
      });
    });
  });

  describe('PatientFacility', () => {
    it('Should replace patient facility records with a new one per facility', async () => {
      const { Facility, PatientFacility } = models;
      const [keep, merge] = await makeTwoPatients(models);

      const facilityWithNone = await Facility.create(fake(Facility)); // eslint-disable-line no-unused-vars

      const facilityWithKeep = await Facility.create(fake(Facility));

      await PatientFacility.create({
        id: PatientFacility.generateId(),
        patientId: keep.id,
        facilityId: facilityWithKeep.id,
      });

      const facilityWithMerge = await Facility.create(fake(Facility));
      await PatientFacility.create({
        id: PatientFacility.generateId(),
        patientId: merge.id,
        facilityId: facilityWithMerge.id,
      });

      const facilityWithBoth = await Facility.create(fake(Facility));
      await PatientFacility.create({
        id: PatientFacility.generateId(),
        patientId: keep.id,
        facilityId: facilityWithBoth.id,
      });
      await PatientFacility.create({
        id: PatientFacility.generateId(),
        patientId: merge.id,
        facilityId: facilityWithBoth.id,
      });

      const prePatientFacilities = await PatientFacility.findAll({});
      expect(prePatientFacilities.length).toEqual(4);

      const { updates } = await mergePatient(models, keep.id, merge.id);
      expect(updates).toEqual({
        Patient: 2,
        PatientFacility: 3,
      });

      const postPatientFacilities = await PatientFacility.findAll({});
      expect(postPatientFacilities.length).toEqual(3);
      expect(postPatientFacilities.map(p => p.facilityId).sort()).toEqual(
        [facilityWithKeep.id, facilityWithMerge.id, facilityWithBoth.id].sort(),
      );
    });
  });

  describe('PatientProgramRegistration', () => {
    let programRegistry1;
    let programRegistry2;

    beforeEach(async () => {
      const { ProgramRegistry, Program } = models;

      const program1 = await Program.create(fake(Program));
      programRegistry1 = await ProgramRegistry.create(
        fake(ProgramRegistry, { programId: program1.id }),
      );
      const program2 = await Program.create(fake(Program));
      programRegistry2 = await ProgramRegistry.create(
        fake(ProgramRegistry, { programId: program2.id }),
      );
    });

    afterEach(async () => {
      const { ProgramRegistry, Program, PatientProgramRegistration } = models;
      await PatientProgramRegistration.truncate({ force: true, cascade: true });
      await ProgramRegistry.truncate({ force: true, cascade: true });
      await Program.truncate({ force: true, cascade: true });
    });

    it('Should merge patient program registrations', async () => {
      const { PatientProgramRegistration } = models;
      const [keep, merge] = await makeTwoPatients(models);

      await PatientProgramRegistration.create({
        patientId: keep.id,
        programRegistryId: programRegistry1.id,
        clinicianId: adminApp.user.id,
      });

      await PatientProgramRegistration.create({
        patientId: merge.id,
        programRegistryId: programRegistry2.id,
        clinicianId: adminApp.user.id,
      });

      const { updates } = await mergePatient(models, keep.id, merge.id);
      expect(updates).toEqual({
        Patient: 2,
        PatientProgramRegistration: 1,
      });

      const newKeepRegistrations = await PatientProgramRegistration.findAll({
        where: { patientId: keep.id },
      });
      expect(newKeepRegistrations).toHaveLength(2); // A new registration has been created for the keep patient from the merge patient
      expect(newKeepRegistrations.map(r => r.programRegistryId)).toEqual(
        expect.arrayContaining([programRegistry1.id, programRegistry2.id]),
      );

      const newMergeRegistrations = await PatientProgramRegistration.findAll({
        where: { patientId: merge.id },
        paranoid: false, // the existing merge registration should be deleted
      });
      expect(newMergeRegistrations).toHaveLength(1);
      expect(newMergeRegistrations[0].programRegistryId).toEqual(programRegistry2.id);
      expect(newMergeRegistrations[0].deletedAt).toBeTruthy();
    });

    it('Should not merge patient program registrations if the keep patient already has a registration for the program registry', async () => {
      const { PatientProgramRegistration } = models;
      const [keep, merge] = await makeTwoPatients(models);

      const originalKeepRegistration1 = await PatientProgramRegistration.create({
        patientId: keep.id,
        programRegistryId: programRegistry1.id,
        clinicianId: adminApp.user.id,
      });
      const originalKeepRegistration2 = await PatientProgramRegistration.create({
        patientId: keep.id,
        programRegistryId: programRegistry2.id,
        clinicianId: adminApp.user.id,
      });
      await originalKeepRegistration2.destroy(); // Even if the registration is deleted, it should still not be merged

      const originalMergeRegistration1 = await PatientProgramRegistration.create({
        patientId: merge.id,
        programRegistryId: programRegistry1.id,
        clinicianId: adminApp.user.id,
      });
      const originalMergeRegistration2 = await PatientProgramRegistration.create({
        patientId: merge.id,
        programRegistryId: programRegistry2.id,
        clinicianId: adminApp.user.id,
      });

      const { updates } = await mergePatient(models, keep.id, merge.id);
      expect(updates).toEqual({
        Patient: 2,
        PatientProgramRegistration: 2,
      });

      const newKeepRegistrations = await PatientProgramRegistration.findAll({
        where: { patientId: keep.id },
      });
      expect(newKeepRegistrations).toHaveLength(1); // No new registration has been created
      expect(newKeepRegistrations[0].id).toEqual(originalKeepRegistration1.id);

      const newMergeRegistrations = await PatientProgramRegistration.findAll({
        where: { patientId: merge.id },
        paranoid: false, // the existing merge registrations should be deleted
      });
      expect(newMergeRegistrations).toHaveLength(2);
      expect(newMergeRegistrations.map(r => r.id)).toEqual(
        expect.arrayContaining([originalMergeRegistration1.id, originalMergeRegistration2.id]),
      );
      newMergeRegistrations.forEach(r => expect(r.deletedAt).toBeTruthy());
    });
  });

  describe('Endpoint', () => {
    it('Should call the function from the endpoint', async () => {
      const [keep, merge] = await makeTwoPatients(models);

      const response = await adminApp.post('/api/admin/mergePatient').send({
        keepPatientId: keep.id,
        unwantedPatientId: merge.id,
      });
      expect(response).toHaveSucceeded();
      expect(response.body.updates).toEqual({
        Patient: 2,
      });

      await keep.reload({ paranoid: false });
      await merge.reload({ paranoid: false });
      expect(keep).toHaveProperty('mergedIntoId', null);
      expect(keep).toHaveProperty('deletedAt', null);
      expect(merge).toHaveProperty('mergedIntoId', keep.id);
      expect(merge).toHaveProperty('visibilityStatus', VISIBILITY_STATUSES.MERGED);
      expect(merge.deletedAt).toBeTruthy();
    });

    it('Should only allow admins to merge patients', async () => {
      const [keep, merge] = await makeTwoPatients(models);
      const app = await baseApp.asRole('reception');

      const response = await app.post('/api/admin/mergePatient').send({
        keepPatientId: keep.id,
        unwantedPatientId: merge.id,
      });
      expect(response).toBeForbidden();
    });

    it('Should return any encountered error', async () => {
      const { Patient } = models;
      const patient = await Patient.create(fake(Patient));

      const response = await adminApp.post('/api/admin/mergePatient').send({
        keepPatientId: patient.id,
        unwantedPatientId: 'doesnt exist',
      });
      expect(response).toHaveRequestError();
    });
  });

  describe('Maintainer task', () => {
    let maintainerTask;
    beforeAll(() => {
      maintainerTask = new PatientMergeMaintainer(ctx);
    });

    it("Should make a fuss if a specificUpdateModel isn't covered", async () => {
      const missingModels = await maintainerTask.checkModelsMissingSpecificUpdateCoverage();
      expect(missingModels).toHaveLength(0);
    });

    it("Should return an empty results object if there's nothing to do", async () => {
      const results = await maintainerTask.remergePatientRecords();
      expect(results).toEqual({});
    });

    it('Should remerge a PatientIssue', async () => {
      // This is a stand-in for all the simple merge models
      const { PatientIssue } = models;

      const [keep, merge] = await makeTwoPatients(models);
      await mergePatient(models, keep.id, merge.id);

      const enc = await PatientIssue.create({
        ...fake(PatientIssue),
        patientId: merge.id,
      });

      const results = await maintainerTask.remergePatientRecords();
      expect(results).toEqual({
        PatientIssue: 1,
      });

      await enc.reload();
      expect(enc.patientId).toEqual(keep.id);
    });

    it('Should remerge some patient additional data', async () => {
      const { PatientAdditionalData, LocalSystemFact } = models;

      const [keep, merge] = await makeTwoPatients(models);
      await mergePatient(models, keep.id, merge.id);

      // give the Keep patient some PAD to reconcile into
      const keepPad = await PatientAdditionalData.create({
        passport: 'keep',
        patientId: keep.id,
      });

      // increment sync tick so the reconciler knows how to merge the records
      await LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK);

      // create second record
      const mergePad = await PatientAdditionalData.create({
        placeOfBirth: 'merge',
        patientId: merge.id,
      });

      const results = await maintainerTask.remergePatientRecords();

      expect(results).toEqual({
        PatientAdditionalData: 1,
      });

      // all of the values should end up in the keep pad
      await keepPad.reload();
      expect(keepPad).toHaveProperty('passport', 'keep');
      expect(keepPad).toHaveProperty('placeOfBirth', 'merge');

      // and the merge pad should be deleted
      const deletedPad = await PatientAdditionalData.findByPk(mergePad.id);
      expect(deletedPad).toBeFalsy();
    });

    it('Should remerge a patient note', async () => {
      const { Note } = models;

      const [keep, merge] = await makeTwoPatients(models);
      await mergePatient(models, keep.id, merge.id);

      const note = await merge.createNote({
        ...fake(Note),
      });

      const results = await maintainerTask.remergePatientRecords();
      expect(results).toEqual({
        Note: 1,
      });

      await note.reload();
      expect(note.recordId).toEqual(keep.id);
    });

    it('Should remerge a patient facility', async () => {
      const { Facility, PatientFacility } = models;

      const facility = await Facility.create(fake(Facility));

      const [keep, merge] = await makeTwoPatients(models);
      await mergePatient(models, keep.id, merge.id);

      // create the facility association after the merge
      await PatientFacility.create({
        facilityId: facility.id,
        patientId: merge.id,
      });

      // remerge it
      const results = await maintainerTask.remergePatientRecords();
      expect(results).toEqual({
        PatientFacility: 1,
      });

      const updatedFacility = await PatientFacility.findOne({
        where: {
          patientId: keep.id,
          facilityId: facility.id,
        },
      });
      expect(updatedFacility).toBeTruthy();

      // ensure the old record was deleted
      const removedFacility = await PatientFacility.findOne({
        where: {
          patientId: merge.id,
          facilityId: facility.id,
        },
      });
      expect(removedFacility).toBeFalsy();
    });

    it('Should remerge PortalUser records', async () => {
      const { PortalUser } = models;

      const [keep, merge] = await makeTwoPatients(models);
      await mergePatient(models, keep.id, merge.id);

      const keepPortalUser = await PortalUser.create({
        email: 'keep@test.com',
        patientId: keep.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        status: PORTAL_USER_STATUSES.PENDING,
      });

      const mergePortalUser = await PortalUser.create({
        email: 'merge@test.com',
        patientId: merge.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        status: PORTAL_USER_STATUSES.REGISTERED,
      });

      const results = await maintainerTask.remergePatientRecords();
      expect(results).toEqual({
        PortalUser: 1,
      });

      // The more active account (merge) should be kept and transferred to the keep patient
      await mergePortalUser.reload();
      expect(mergePortalUser.patientId).toEqual(keep.id);
      expect(mergePortalUser.status).toEqual(PORTAL_USER_STATUSES.REGISTERED);

      // The less active account should be deleted
      const deletedPortalUser = await PortalUser.findByPk(keepPortalUser.id);
      expect(deletedPortalUser).toBeFalsy();

      const remainingPortalUsers = await PortalUser.findAll({
        where: { patientId: keep.id },
      });
      expect(remainingPortalUsers).toHaveLength(1);
    });
  });
});
