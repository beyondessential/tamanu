import { mergePatient, getTablesWithNoMergeCoverage } from "../../app/admin/patientMerge/mergePatient";
import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from '../utilities';
import { VISIBILITY_STATUSES } from 'shared/constants';

describe("Patient merge", () => {

  let models;

  beforeAll(async () => {
    const ctx = await createTestContext();
    models = ctx.store.models;
  });

  it.only("Should make a fuss if any models with a patientId aren't covered", async () => {
    const tables = await getTablesWithNoMergeCoverage(models);
    expect(tables).toHaveLength(0);
  });

  it("Should merge a patient with no additional records", async () => {
    const { Patient } = models;
    const keep = await models.Patient.create({
      ...fake(Patient),
    });
    const merge = await models.Patient.create({
      ...fake(Patient),
    });

    const result = await mergePatient(models, keep.id, merge.id);
    expect(result).toEqual({
      patient: 1,
    });

    await keep.reload({ paranoid: false });
    await merge.reload({ paranoid: false });
    expect(keep).toHaveProperty('mergedIntoId', null);
    expect(keep).toHaveProperty('deletedAt', null);
    expect(merge).toHaveProperty('mergedIntoId', keep.id);
    expect(merge).toHaveProperty('visibilityStatus', VISIBILITY_STATUSES.MERGED);
    expect(merge.deletedAt).toBeTruthy();
  });
  
  it('Should merge a patient with an encounter', async () => {
    const { Patient, Encounter } = models;
    const keep = await models.Patient.create({
      ...fake(Patient),
    });
    const merge = await models.Patient.create({
      ...fake(Patient),
    });

    const encounter = await models.Encounter.create({
      ...fake(Encounter),
      patientId: merge.id,
    });
    
    await mergePatient(models, keep.id, merge.id);
    await encounter.reload();
    expect(encounter).toHaveProperty('patientId', keep.id);
  });

  it('Should merge a patient with multiple encounters', async () => {
    
  });
  
  it('Should merge a patient with some extra records', async () => {
    
  });
  
  it('Should merge a patient with a mix of encounters and other records', async () => {
    
  });

});
