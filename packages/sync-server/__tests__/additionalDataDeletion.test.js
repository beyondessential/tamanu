import { createTestContext } from './utilities';
import { createDummyPatient } from 'shared/demoData/patients';
import { reconcilePatient, removeDuplicatedPatientAdditionalData } from '../app/subCommands/removeDuplicatedPatientAdditionalData';

describe('Lab test publisher', () => {

  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(() => ctx.close());

  it('Should delete duplicate records', async () => {
    const patient = await models.Patient.create(createDummyPatient());
    const realData = await models.PatientAdditionalData.create({ patientId: patient.id, passport: '12345' });
    const nullData = await models.PatientAdditionalData.create({ patientId: patient.id });
    const nullData2 = await models.PatientAdditionalData.create({ patientId: patient.id });

    const results = await reconcilePatient(ctx.store.sequelize, patient.id);
    await realData.reload();
    await nullData.reload();
    await nullData2.reload();

    console.log("REAL", realData.dataValues);
    console.log("NULL", nullData.dataValues);
    console.log("NULL2", nullData2.dataValues);


    expect(results).toHaveProperty('deleted', 2);
    expect(results).toHaveProperty('unmergeable', 0);
    expect(realData.deletedAt).toBeFalsy();
    expect(nullData.deletedAt).toBeTruthy();
    expect(nullData2.deletedAt).toBeTruthy();
    expect(realData).toHaveProperty('mergedIntoId', realAdditional.id);
    expect(nullData).toHaveProperty('mergedIntoId', realAdditional.id);
    expect(nullData2).toHaveProperty('mergedIntoId', realAdditional.id);
  });

  it('Should not delete a duplicate record with data in it', async () => {
    const patient = await models.Patient.create(createDummyPatient());
    const realData = await models.PatientAdditionalData.create({ patientId: patient.id, passport: '12345' });
    const realData2 = await models.PatientAdditionalData.create({ patientId: patient.id, passport: '99999' });
    const nullData = await models.PatientAdditionalData.create({ patientId: patient.id });

    const results = await reconcilePatient(ctx.store.sequelize, patient.id);
    await realData.reload();
    await realData2.reload();
    await nullData.reload();

    expect(results).toHaveProperty('deleted', 1);
    expect(results).toHaveProperty('unmergeable', 1);
    expect(realData.deletedAt).toBeFalsy();
    expect(realData2.deletedAt).toBeFalsy();
    expect(nullData.deletedAt).toBeTruthy();
    expect(nullData).toHaveProperty('mergedIntoId', realData.id);
    expect(realData2).not.toHaveProperty('mergedIntoId')
  });

  it('Should merge a null record into one with data', async () => {

  });


});