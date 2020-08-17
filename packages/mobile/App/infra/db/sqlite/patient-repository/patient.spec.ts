import { createFakeConnection, SqliteHelper } from '../helpers/sqlite-helper';
import { PatientEntity } from '/root/App/entities/PatientEntity';
import { PatientSqliteRepository } from './patient';
import { generatePatient } from '../helpers/seed-methods';

describe('PatientSqliteRepository', () => {

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
     await patientRepo.delete({ })   
     SqliteHelper.client.close()  
  })

  const makeSut = (): PatientSqliteRepository => {
    return new PatientSqliteRepository()
  }

  test('should return patients on success ', async () => {
    const sut = makeSut()
    const patients = await sut.getAll()
    expect(patients.length).toBe(1)    
    });
});
