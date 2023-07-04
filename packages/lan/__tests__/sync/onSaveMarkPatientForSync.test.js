import { beforeAll, describe, it } from '@jest/globals';

import { fake, fakeReferenceData } from 'shared/test-helpers/fake';

import { createTestContext } from '../utilities';

const fakeRecordFnByModel = {
  DocumentMetadata: async (models, patientId) => {
    const { DocumentMetadata } = models;
    return fake(DocumentMetadata, { patientId });
  },
  Encounter: async (models, patientId) => {
    const { Facility, Location, Department, User, Encounter } = models;
    const facility = await Facility.create(fake(Facility));
    const location = await Location.create(fake(Location, { facilityId: facility.id }));
    const department = await Department.create(fake(Department, { facilityId: facility.id }));
    const user = await User.create(fake(User));
    return fake(Encounter, {
      patientId,
      locationId: location.id,
      departmentId: department.id,
      examinerId: user.id,
    });
  },
  PatientAdditionalData: async (models, patientId) => {
    const { PatientAdditionalData } = models;
    return fake(PatientAdditionalData, { patientId });
  },
  PatientAllergy: async (models, patientId) => {
    const { PatientAllergy, User, ReferenceData } = models;
    const user = await User.create(fake(User));
    const allergy = await ReferenceData.create(fakeReferenceData());
    return fake(PatientAllergy, { patientId, practitionerId: user.id, allergyId: allergy.id });
  },
  PatientBirthData: async (models, patientId) => {
    const { PatientBirthData } = models;
    return fake(PatientBirthData, { patientId });
  },
  PatientCarePlan: async (models, patientId) => {
    const { PatientCarePlan, ReferenceData, User } = models;
    const user = await User.create(fake(User));
    const carePlan = await ReferenceData.create(fakeReferenceData());
    return fake(PatientCarePlan, { patientId, examinerId: user.id, carePlanId: carePlan.id });
  },
  PatientCondition: async (models, patientId) => {
    const { PatientCondition, ReferenceData, User } = models;
    const user = await User.create(fake(User));
    const condition = await ReferenceData.create(fakeReferenceData());
    return fake(PatientCondition, { patientId, examinerId: user.id, conditionId: condition.id });
  },
  PatientDeathData: async (models, patientId) => {
    const { PatientDeathData, User } = models;
    const user = await User.create(fake(User));
    return fake(PatientDeathData, {
      patientId,
      clinicianId: user.id,
      recentSurgery: 'yes',
      wasPregnant: 'yes',
      pregnancyContributed: 'yes',
      stillborn: 'yes',
    });
  },
  PatientFamilyHistory: async (models, patientId) => {
    const { PatientFamilyHistory, ReferenceData, User } = models;
    const user = await User.create(fake(User));
    const diagnosis = await ReferenceData.create(fakeReferenceData());
    return fake(PatientFamilyHistory, {
      patientId,
      practitionerId: user.id,
      diagnosisId: diagnosis.id,
    });
  },
  PatientFieldValue: async (models, patientId) => {
    const { PatientFieldValue, PatientFieldDefinition, PatientFieldDefinitionCategory } = models;
    const category = await PatientFieldDefinitionCategory.create(
      fake(PatientFieldDefinitionCategory),
    );
    const definition = await PatientFieldDefinition.create(
      fake(PatientFieldDefinition, {
        fieldType: 'string',
        visibilityStatus: 'current',
        categoryId: category.id,
        options: ['one', 'two', 'xxx'],
      }),
    );
    return fake(PatientFieldValue, { patientId, definitionId: definition.id, value: 'one' });
  },
  PatientIssue: async (models, patientId) => {
    const { PatientIssue } = models;
    return fake(PatientIssue, { patientId, type: 'issue' });
  },
  PatientSecondaryId: async (models, patientId) => {
    const { PatientSecondaryId, ReferenceData } = models;
    const type = await ReferenceData.create(fakeReferenceData());
    return fake(PatientSecondaryId, { patientId, typeId: type.id });
  },
};

const textFieldByModel = {
  DocumentMetadata: 'name',
  Encounter: 'reasonForEncounter',
  PatientAdditionalData: 'passport',
  PatientAllergy: 'note',
  PatientBirthData: 'birthDeliveryType',
  PatientCondition: 'note',
  PatientDeathData: 'manner',
  PatientFamilyHistory: 'note',
  PatientFieldValue: 'value',
  PatientIssue: 'note',
  PatientSecondaryId: 'value',
};

describe('databaseState', () => {
  let ctx, models, Patient, PatientFacility;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    Patient = models.Patient;
    PatientFacility = models.PatientFacility;
  });

  afterAll(() => ctx.close());

  const expectPatientFacility = async (patientId, toExist) => {
    const patientFacility = await PatientFacility.findOne({
      where: {
        patientId,
        facilityId: 'balwyn',
      },
    });
    if (toExist) {
      expect(patientFacility).toBeTruthy();
    } else {
      expect(patientFacility).toBeFalsy();
    }
  };

  it('creating a patient marks them for sync', async () => {
    const patient = await Patient.create(fake(Patient));
    await expectPatientFacility(patient.id, true);
  });

  it('creating a patient via bulk create does not mark them for sync', async () => {
    // this tests that when they get bulk created during the sync pull process they are not
    // immediately marked for sync
    const patient = fake(Patient);
    await Patient.bulkCreate([fake(Patient)]);
    await expectPatientFacility(patient.id, false);
  });

  it('updating a patient via modify-then-save marks them for sync', async () => {
    // create a patient without using hooks so we don't mark them for sync on create
    const patient = await Patient.create(fake(Patient), {
      hooks: false,
    });
    await expectPatientFacility(patient.id, false);
    patient.firstName = 'Change';
    await patient.save();
    await expectPatientFacility(patient.id, true);
  });

  it('updating a patient via update() marks them for sync', async () => {
    // create a patient without using hooks so we don't mark them for sync on create
    const patient = await Patient.create(fake(Patient), {
      hooks: false,
    });
    await expectPatientFacility(patient.id, false);
    await patient.update({ firstName: 'Change' });
    await expectPatientFacility(patient.id, true);
  });

  it('updating a patient via bulk update does not mark them for sync', async () => {
    // create a patient without using hooks so we don't mark them for sync on create
    const patient = await Patient.create(fake(Patient), {
      hooks: false,
    });
    await expectPatientFacility(patient.id, false);
    await Patient.update({ firstName: 'Change' }, { where: { id: patient.id } });
    await expectPatientFacility(patient.id, false);
  });

  it('creating a record in a relevant table marks the patient for sync', async () => {
    for (const [modelName, fakeRecord] of Object.entries(fakeRecordFnByModel)) {
      // create a patient without using hooks so we don't mark them for sync on create
      const patient = await Patient.create(fake(Patient), {
        hooks: false,
      });
      await expectPatientFacility(patient.id, false);
      const record = await fakeRecord(models, patient.id);
      await models[modelName].create(record);
      await expectPatientFacility(patient.id, true);
    }
  });

  it('bulk creating records in a relevant table does not mark the patient for sync', async () => {
    // this tests that when they get bulk created during the sync pull process the patient is not
    // immediately marked for sync
    for (const [modelName, fakeRecord] of Object.entries(fakeRecordFnByModel)) {
      // create a patient without using hooks so we don't mark them for sync on create
      const patient = await Patient.create(fake(Patient), {
        hooks: false,
      });
      await expectPatientFacility(patient.id, false);
      const record = await fakeRecord(models, patient.id);
      await models[modelName].bulkCreate([record]);
      await expectPatientFacility(patient.id, false);
    }
  });

  it('updating a record via modify-and-save in a relevant table does not mark the patient for sync', async () => {
    // we only expect creates of related tables to mark patients for sync, as some facilities sync e.g. all
    // lab request encounters, and if they edit them, we don't want that to add the patient for sync
    for (const [modelName, fakeRecord] of Object.entries(fakeRecordFnByModel)) {
      // create a patient without using hooks so we don't mark them for sync on create
      const patient = await Patient.create(fake(Patient), {
        hooks: false,
      });
      await expectPatientFacility(patient.id, false);
      const record = await fakeRecord(models, patient.id);
      const instance = await models[modelName].create(record, { hooks: false }); // turn off hooks - we're testing update
      await expectPatientFacility(patient.id, false);

      // edit is arbitrary, use any text field for editing ease

      instance[textFieldByModel[modelName]] = 'xxx';
      await instance.save();
      await expectPatientFacility(patient.id, false);
    }
  });

  it('updating a record via update() in a relevant table does not mark the patient for sync', async () => {
    // we only expect creates of related tables to mark patients for sync, as some facilities sync e.g. all
    // lab request encounters, and if they edit them, we don't want that to add the patient for sync
    for (const [modelName, fakeRecord] of Object.entries(fakeRecordFnByModel)) {
      // create a patient without using hooks so we don't mark them for sync on create
      const patient = await Patient.create(fake(Patient), {
        hooks: false,
      });
      await expectPatientFacility(patient.id, false);
      const record = await fakeRecord(models, patient.id);
      const instance = await models[modelName].create(record, { hooks: false }); // turn off hooks - we're testing update
      await expectPatientFacility(patient.id, false);

      // edit is arbitrary, use any text field for editing ease
      await instance.update({ [textFieldByModel[modelName]]: 'xxx' });
      await expectPatientFacility(patient.id, false);
    }
  });

  it('updating a record via bulk update in a relevant table does not mark the patient for sync', async () => {
    // we only expect creates of related tables to mark patients for sync, as some facilities sync e.g. all
    // lab request encounters, and if they edit them, we don't want that to add the patient for sync
    for (const [modelName, fakeRecord] of Object.entries(fakeRecordFnByModel)) {
      // create a patient without using hooks so we don't mark them for sync on create
      const patient = await Patient.create(fake(Patient), {
        hooks: false,
      });
      await expectPatientFacility(patient.id, false);
      const record = await fakeRecord(models, patient.id);
      await models[modelName].create(record, { hooks: false }); // turn off hooks - we're testing update
      await expectPatientFacility(patient.id, false);

      // edit is arbitrary, use any text field for editing ease
      await models[modelName].update(
        { ...record, [textFieldByModel[modelName]]: 'xxx' },
        { where: { id: record.id } },
      );
      await expectPatientFacility(patient.id, false);
    }
  });
});
