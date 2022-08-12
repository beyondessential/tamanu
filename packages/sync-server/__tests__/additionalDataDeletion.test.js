import { createTestContext } from './utilities';
import { createDummyPatient } from 'shared/demoData/patients';
import { reconcilePatient, removeDuplicatedPatientAdditionalData } from '../app/utils/removeDuplicatedPatientAdditionalData';
import { QueryTypes } from 'sequelize';

describe('Lab test publisher', () => {

  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  beforeEach(async () => {
    await models.PatientAdditionalData.destroy({ 
      truncate: true,
      cascade: true,
    });
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

  it('Should merge in a record that has no direct conflicts', async () => {
    const patient = await models.Patient.create(createDummyPatient());
    const realData = await models.PatientAdditionalData.create({ patientId: patient.id, passport: 'passport' });
    const mergedData = await models.PatientAdditionalData.create({ patientId: patient.id, drivingLicense: 'drivingLicense' });
    const mergedData2 = await models.PatientAdditionalData.create({ patientId: patient.id, birthCertificate: 'birthCertificate' });

    const results = await reconcilePatient(ctx.store.sequelize, patient.id);
    expect(results).toHaveProperty('deleted', 2);
    expect(results).toHaveProperty('unmergeable', 0);

    const updatedReal = await loadEvenIfDeleted(realData);
    expect(updatedReal.deletedAt).toBeFalsy();
    expect(updatedReal).toHaveProperty('mergedIntoId', null);
    expect(updatedReal).toHaveProperty('passport', 'passport');
    expect(updatedReal).toHaveProperty('drivingLicense', 'drivingLicense');
    expect(updatedReal).toHaveProperty('birthCertificate', 'birthCertificate');

    const updatedMerged = await loadEvenIfDeleted(mergedData);
    expect(updatedMerged.deletedAt).toBeTruthy();
    expect(updatedMerged).toHaveProperty('mergedIntoId', realData.id);

    const updatedMerged2 = await loadEvenIfDeleted(mergedData2);
    expect(updatedMerged2.deletedAt).toBeTruthy();
    expect(updatedMerged2).toHaveProperty('mergedIntoId', realData.id);
  });
  
  it('Should merge in multiple duplicates whose non-null fields align', async () => {
    const patient = await models.Patient.create(createDummyPatient());
    const realData = await models.PatientAdditionalData.create({ patientId: patient.id, passport: 'passport' });
    const mergedData = await models.PatientAdditionalData.create({ patientId: patient.id, passport: 'passport', drivingLicense: 'drivingLicense', bloodType: 'A-' });
    const mergedData2 = await models.PatientAdditionalData.create({ patientId: patient.id, passport: 'passport', drivingLicense: 'drivingLicense', birthCertificate: 'birthCertificate' });

    const results = await reconcilePatient(ctx.store.sequelize, patient.id);
    expect(results).toHaveProperty('deleted', 2);
    expect(results).toHaveProperty('unmergeable', 0);

    const updatedReal = await loadEvenIfDeleted(realData);
    expect(updatedReal.deletedAt).toBeFalsy();
    expect(updatedReal).toHaveProperty('mergedIntoId', null);
    expect(updatedReal).toHaveProperty('passport', 'passport');
    expect(updatedReal).toHaveProperty('drivingLicense', 'drivingLicense');
    expect(updatedReal).toHaveProperty('birthCertificate', 'birthCertificate');
    expect(updatedReal).toHaveProperty('bloodType', 'A-');

    const updatedMerged = await loadEvenIfDeleted(mergedData);
    expect(updatedMerged.deletedAt).toBeTruthy();
    expect(updatedMerged).toHaveProperty('mergedIntoId', realData.id);

    const updatedMerged2 = await loadEvenIfDeleted(mergedData2);
    expect(updatedMerged2.deletedAt).toBeTruthy();
    expect(updatedMerged2).toHaveProperty('mergedIntoId', realData.id);
  });
  
  it('Should only merge one duplicate record if duplicates conflict with each other', async () => {
    const patient = await models.Patient.create(createDummyPatient());
    const realData = await models.PatientAdditionalData.create({ patientId: patient.id, passport: 'passport' });
    const mergedOKData = await models.PatientAdditionalData.create({ patientId: patient.id, drivingLicense: 'drivingLicense' });
    const mergedBadData = await models.PatientAdditionalData.create({ patientId: patient.id, drivingLicense: 'otherDriving' });

    const results = await reconcilePatient(ctx.store.sequelize, patient.id);
    expect(results).toHaveProperty('deleted', 1);
    expect(results).toHaveProperty('unmergeable', 1);

    const updatedReal = await loadEvenIfDeleted(realData);
    expect(updatedReal.deletedAt).toBeFalsy();
    expect(updatedReal).toHaveProperty('mergedIntoId', null);
    expect(updatedReal).toHaveProperty('passport', 'passport');
    expect(updatedReal).toHaveProperty('drivingLicense', 'drivingLicense');

    const updatedMerged = await loadEvenIfDeleted(mergedOKData);
    expect(updatedMerged.deletedAt).toBeTruthy();
    expect(updatedMerged).toHaveProperty('mergedIntoId', realData.id);

    const updatedMerged2 = await loadEvenIfDeleted(mergedBadData);
    expect(updatedMerged2.deletedAt).toBeFalsy();
    expect(updatedMerged2).toHaveProperty('mergedIntoId', null);
  });

  it('Should not merge a duplicate record with conflicting data', async () => {
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
    const makePatientAdditionals = async (nullAmount, realAmount) => {
      const patient = await models.Patient.create(createDummyPatient());
      const records = [];
      for (let i = 0; i < nullAmount; ++i) { 
        records.push({ patientId: patient.id });
      }
      for (let i = 0; i < realAmount; ++i) { 
        records.push({ patientId: patient.id, passport: `${Math.random()}` });
      }
      await Promise.all(records.map(x => models.PatientAdditionalData.create(x)));
    };

    await Promise.all([
      // a few patients who should be ignored entirely
      makePatientAdditionals(0, 1),
      makePatientAdditionals(0, 1),
      makePatientAdditionals(1, 0),
      makePatientAdditionals(1, 0),

      // a few with some deletions
      makePatientAdditionals(1, 1),
      makePatientAdditionals(2, 1),
      makePatientAdditionals(3, 1),

      // one with an unmergeable duplicate and a mergeable duplicate
      makePatientAdditionals(1, 2),
      
      // one with only unmergeables
      makePatientAdditionals(0, 2),
    ]);

    const tallies = await removeDuplicatedPatientAdditionalData(ctx.store.sequelize);
    expect(tallies).toHaveProperty('patients', 3 + 1 + 1);
    expect(tallies).toHaveProperty('deleted', (1 + 2 + 3) + 1);
    expect(tallies).toHaveProperty('unmergeable', 2);
    expect(tallies).toHaveProperty('errors', 0);
  });

});