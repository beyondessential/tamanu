import { mergePatient, getTablesWithNoMergeCoverage } from "../../app/admin/patientMerge/mergePatient";
import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from '../utilities';
import { VISIBILITY_STATUSES } from 'shared/constants';
import { InvalidParameterError } from 'shared/errors';

describe("Patient merge", () => {

  let ctx;
  let models;
  let baseApp;
  let adminApp;

  const makeTwoPatients = async (overridesKeep = {}, overridesMerge = {}) => {
    const { Patient } = models;
    const keep = await models.Patient.create({
      ...fake(Patient),
      ...overridesKeep,
    });
    const merge = await models.Patient.create({
      ...fake(Patient),
      ...overridesMerge,
    });
    return [keep, merge];
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    adminApp = await baseApp.asRole('admin');
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

  it("Should merge a patient with no additional records", async () => {
    const [keep, merge] = await makeTwoPatients();

    const { updates } = await mergePatient(models, keep.id, merge.id);
    expect(updates).toEqual({
      Patient: 1,
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
    const { Encounter } = models;

    const [keep, merge] = await makeTwoPatients();

    const mergeEnc = await models.Encounter.create({
      ...fake(Encounter),
      patientId: merge.id,
    });
    const mergeEnc2 = await models.Encounter.create({
      ...fake(Encounter),
      patientId: merge.id,
    });
    const keepEnc = await models.Encounter.create({
      ...fake(Encounter),
      patientId: keep.id,
    });

    const { updates } = await mergePatient(models, keep.id, merge.id);

    expect(updates).toEqual({
      Patient: 1,
      Encounter: 2,
    });

    for (const e of [mergeEnc, mergeEnc2, keepEnc]) {
      await e.reload();
      expect(e).toHaveProperty('patientId', keep.id);  
    }
  
    expect(await keep.getEncounters()).toHaveLength(3);
    expect(await merge.getEncounters()).toHaveLength(0);
  });

  it('Should merge a patient with some extra records', async () => {
    const [keep, merge] = await makeTwoPatients();
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
      Patient: 1,
      PatientAllergy: 1,
      PatientIssue: 1,
    });

    await allergy.reload();
    expect(allergy).toHaveProperty('patientId', keep.id);
    await issue.reload();
    expect(issue).toHaveProperty('patientId', keep.id);
  });
  
  it('Should merge death data cleanly', async () => {
    // Theoretically this should behave the same as other records but I (@mclean) 
    // encountered a validation issue* during dev, so I'm just including this 
    // additional test to be safe.
    // *complaints of a missing clinicianId despite not updating any records
    const [keep, merge] = await makeTwoPatients();

    const clinician = await models.User.create(fake(models.User));
    const death = await models.PatientDeathData.create({
      ...fake(models.PatientDeathData),
      patientId: merge.id,
      clinicianId: clinician.id,
    });

    const { updates } = await mergePatient(models, keep.id, merge.id);
    expect(updates).toEqual({
      Patient: 1,
      PatientDeathData: 1,
    });

    await death.reload();
    expect(death).toHaveProperty('patientId', keep.id);
  });

  it("Should throw if the keep patient and merge patient are the same", async () => {
    const { Patient } = models;
    const keep = await Patient.create(fake(Patient));
    expect(() => mergePatient(models, keep.id, keep.id)).rejects.toThrow(InvalidParameterError);
  });

  it("Should throw if the keep patient doesn't exist", async () => {
    const { Patient } = models;
    const keep = await Patient.create(fake(Patient));
    expect(() => mergePatient(models, keep.id, 'not real')).rejects.toThrow(InvalidParameterError);
  });

  it("Should throw if the merge patient doesn't exist", async () => {
    const { Patient } = models;
    const merge = await Patient.create(fake(Patient));
    expect(() => mergePatient(models, 'not real', merge.id)).rejects.toThrow(InvalidParameterError);
  });

  describe('PatientAdditionalData', () => {
    it('Should merge patient additional data cleanly', async () => {
      const { PatientAdditionalData } = models;
      const [keep, merge] = await makeTwoPatients();

      const keepPatientPad = await PatientAdditionalData.create({
        patientId: keep.id,
        passport: 'keep-passport',
      });

      const mergePatientPad = await PatientAdditionalData.create({
        patientId: merge.id,
        primaryContactNumber: 'merge-phone',
      });

      const { updates } = await mergePatient(models, keep.id, merge.id);
      expect(updates).toEqual({
        Patient: 1,
        PatientAdditionalData: 1,
      });

      await keepPatientPad.reload({ paranoid: false });
      await mergePatientPad.reload({ paranoid: false });

      expect(keepPatientPad).toHaveProperty('deletedAt', null);
      expect(keepPatientPad).toHaveProperty('passport', 'keep-passport');
      expect(keepPatientPad).toHaveProperty('primaryContactNumber', 'merge-phone');
      expect(mergePatientPad).toHaveProperty('patientId', keep.id);
      expect(mergePatientPad.deletedAt).toBeTruthy();
    });

    it('Should merge patient additional data even if the keep patient PAD is null', async () => {
      const { PatientAdditionalData } = models;
      const [keep, merge] = await makeTwoPatients();
  
      const keepPatientPad = await PatientAdditionalData.create({
        patientId: keep.id,
      });
  
      const mergePatientPad = await PatientAdditionalData.create({
        patientId: merge.id,
        primaryContactNumber: 'merge-phone',
      });

      const { updates } = await mergePatient(models, keep.id, merge.id);
      expect(updates).toEqual({
        Patient: 1,
        PatientAdditionalData: 1,
      });

      await keepPatientPad.reload({ paranoid: false });
      await mergePatientPad.reload({ paranoid: false });

      expect(mergePatientPad).toHaveProperty('deletedAt', null);
      expect(mergePatientPad).toHaveProperty('primaryContactNumber', 'merge-phone');
      expect(mergePatientPad).toHaveProperty('patientId', keep.id);
      expect(keepPatientPad.deletedAt).toBeTruthy();
    });
  });

  describe('Endpoint', () => {
    it('Should call the function from the endpoint', async () => {
      const [keep, merge] = await makeTwoPatients();

      const response = await adminApp.post('/v1/admin/mergePatient').send({
        keepPatientId: keep.id,
        unwantedPatientId: merge.id,
      });
      expect(response).toHaveSucceeded();
      expect(response.body.updates).toEqual({
        Patient: 1,
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
      const [keep, merge] = await makeTwoPatients();
      const app = await baseApp.asRole('reception');

      const response = await app.post('/v1/admin/mergePatient').send({
        keepPatientId: keep.id,
        unwantedPatientId: merge.id,
      });
      expect(response).toBeForbidden();
    });

    it("Should return any encountered error", async () => {
      const { Patient } = models;
      const patient = await Patient.create(fake(Patient));

      const response = await adminApp.post('/v1/admin/mergePatient').send({
        keepPatientId: patient.id,
        unwantedPatientId: 'doesnt exist',
      });
      expect(response).toHaveRequestError();
    });
  });
});
