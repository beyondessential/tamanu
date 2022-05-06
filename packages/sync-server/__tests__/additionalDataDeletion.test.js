import { createTestContext } from './utilities';
import { createDummyPatient } from 'shared/demoData/patients';
import { reconcilePatient, removeDuplicatedPatientAdditionalData } from '../app/subCommands/removeDuplicatedPatientAdditionalData';
import { QueryTypes } from 'sequelize';

describe('Lab test publisher', () => {

  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(() => ctx.close());

  const loadEvenIfDeleted = async (record) => {
    const [result] = await ctx.store.sequelize.query(`
      SELECT * FROM patient_additional_data WHERE id = :id
    `, { 
      replacements: {
        id: record.id, 
      },
      model: models.PatientAdditionalData,
      type: QueryTypes.SELECT,
      mapToModel: true,
    });
    return result;
  };

  it('Should delete duplicate records', async () => {
    const patient = await models.Patient.create(createDummyPatient());
    const realData = await models.PatientAdditionalData.create({ patientId: patient.id, passport: '12345' });
    const nullData = await models.PatientAdditionalData.create({ patientId: patient.id });
    const nullData2 = await models.PatientAdditionalData.create({ patientId: patient.id });

    const results = await reconcilePatient(ctx.store.sequelize, patient.id);
    expect(results).toHaveProperty('deleted', 2);
    expect(results).toHaveProperty('unmergeable', 0);

    const updatedReal = await loadEvenIfDeleted(realData);
    expect(updatedReal.deletedAt).toBeFalsy();
    expect(updatedReal).toHaveProperty('mergedIntoId', null);

    const updatedNull = await loadEvenIfDeleted(nullData);
    expect(updatedNull.deletedAt).toBeTruthy();
    expect(updatedNull).toHaveProperty('mergedIntoId', realData.id);

    const updatedNull2 = await loadEvenIfDeleted(nullData2);
    expect(updatedNull2.deletedAt).toBeTruthy();
    expect(updatedNull2).toHaveProperty('mergedIntoId', realData.id);
  });

  it('Should not delete a duplicate record with data in it', async () => {
    const patient = await models.Patient.create(createDummyPatient());
    const realData = await models.PatientAdditionalData.create({ patientId: patient.id, passport: '12345' });
    const realData2 = await models.PatientAdditionalData.create({ patientId: patient.id, passport: '99999' });
    const nullData = await models.PatientAdditionalData.create({ patientId: patient.id });

    const results = await reconcilePatient(ctx.store.sequelize, patient.id);
    expect(results).toHaveProperty('deleted', 1);
    expect(results).toHaveProperty('unmergeable', 1);
    
    const updatedReal = await loadEvenIfDeleted(realData);
    expect(updatedReal.deletedAt).toBeFalsy();
    expect(updatedReal).toHaveProperty('mergedIntoId', null)

    const updatedReal2 = await loadEvenIfDeleted(realData2);
    expect(updatedReal2.deletedAt).toBeFalsy();
    expect(updatedReal2).toHaveProperty('mergedIntoId', null)

    const updatedNull = await loadEvenIfDeleted(nullData);
    expect(updatedNull.deletedAt).toBeTruthy();
    expect(updatedNull).toHaveProperty('mergedIntoId', realData.id);
  });

  it('Should merge a null record into one with data even if the null one is older', async () => {
    const patient = await models.Patient.create(createDummyPatient());

    const nullData = await models.PatientAdditionalData.create({ patientId: patient.id });
    const nullData2 = await models.PatientAdditionalData.create({ patientId: patient.id });
    const realData = await models.PatientAdditionalData.create({ patientId: patient.id, passport: '12345' });

    const results = await reconcilePatient(ctx.store.sequelize, patient.id);
    expect(results).toHaveProperty('deleted', 2);
    expect(results).toHaveProperty('unmergeable', 0);

    const updatedReal = await loadEvenIfDeleted(realData);
    expect(updatedReal.deletedAt).toBeFalsy();
    expect(updatedReal).toHaveProperty('mergedIntoId', null);

    const updatedNull = await loadEvenIfDeleted(nullData);
    expect(updatedNull.deletedAt).toBeTruthy();
    expect(updatedNull).toHaveProperty('mergedIntoId', realData.id);

    const updatedNull2 = await loadEvenIfDeleted(nullData2);
    expect(updatedNull2.deletedAt).toBeTruthy();
    expect(updatedNull2).toHaveProperty('mergedIntoId', realData.id);
  });

  it('Should find patients which require merging', async () => {
    
  });

});