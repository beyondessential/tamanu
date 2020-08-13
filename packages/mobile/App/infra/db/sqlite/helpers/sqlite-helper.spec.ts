import { createFakeConnection, SqliteHelper } from './sqlite-helper';
import { PatientEntity } from '/root/App/entities';
import { generatePatient } from './seed-methods';


describe('SqliteHelper Test', () => {

  beforeAll(async () => {
    try {      
      SqliteHelper.client = await createFakeConnection();
      const patientRepo = SqliteHelper.client.getRepository(PatientEntity);      
      const patient = generatePatient()        
      await  patientRepo.save(patient)
    } catch (error) {
      // remove --silent in package.json test script to get logs
      console.log(error);
    }
  });
  afterAll(async () => {
     const patientRepo = SqliteHelper.client.getRepository(PatientEntity);
     await patientRepo.delete({})     
  })
  test('should return patients if there are patient data', async () => {
      // add Patients
    expect(SqliteHelper.client).toBeTruthy();
    const patientRepo = SqliteHelper.client.getRepository(PatientEntity);      
    const patients = await patientRepo.find({})
    expect(patients.length).toBe(1)
  });
});
