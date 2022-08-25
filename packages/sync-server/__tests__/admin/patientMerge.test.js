import { mergePatient, getTablesWithNoMergeCoverage } from "../../app/admin/patientMerge/mergePatient";
import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from '../utilities';
import { VISIBILITY_STATUSES } from 'shared/constants';

describe("Patient merge", () => {

  let models;

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
    const ctx = await createTestContext();
    models = ctx.store.models;
  });

  it("Should make a fuss if any models with a patientId aren't covered", async () => {
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
    // expect(merge.deletedAt).toBeTruthy();
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
    // Theoretically this should behave the same as other records but I (@mclean) encountered
    // a weird validation issue* during dev, so I'm just including this additional test to
    // be safe.
    // * was complaining about a missing clinicianId even though it wasn't updating any records
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

  it.todo('Should merge patient additional data cleanly');

});
