import { DbGetPatients } from "./db-get-patients";
import { GetPatientsRepository } from "../../protocols/patient/get-patient-repository";
import { PatientModel } from "/root/App/ui/models/Patient";
import { Gender } from "/root/App/ui/helpers/constants";

const fakedate = new Date()
const makeFakePatientList = () => ([
        {
          id: 'valid-id',
          displayId: 'dis',
          firstName: 'first-name',
          lastName: 'last-name',
          middleName: 'middle-name',
          gender: Gender.Male,
          birthDate: fakedate,
          culturalTraditionName: 'cultural-name',
        },
      ])

const makeGetPatientsRepository = (): GetPatientsRepository => {
  class GetPatientsRepositoryStub implements GetPatientsRepository {
    async getAll(): Promise<PatientModel[]> {
      return Promise.resolve(makeFakePatientList());
    }
  }
  return new GetPatientsRepositoryStub();
};

interface SutTypes {
  sut: DbGetPatients;
  getPatientsRepository: GetPatientsRepository;
}
const makeSut = (): SutTypes => {
  const getPatientsRepository = makeGetPatientsRepository();
  const sut = new DbGetPatients(getPatientsRepository);
  return {
    sut,
    getPatientsRepository,
  };
};

describe('DbGetPatients', () => {
  test('should call getPatientsRepository', async () => {
    const { sut, getPatientsRepository } = makeSut()        
    const getAllSpy = jest.spyOn(getPatientsRepository, 'getAll');
    await sut.get()
    expect(getAllSpy).toHaveBeenCalled()
  });    
  test('should return patients ', async () => {    
    const { sut } = makeSut()            
    const patients = await sut.get()    
    expect(patients).toEqual(makeFakePatientList())
  });    
});