import { GetPatients } from '/root/App/domain/usecases/patient/get-patients';
import { PatientModel } from '/root/App/ui/models/Patient';
import { Gender } from '/root/App/ui/helpers/constants';
import { GetPatientsController } from './get-patients';

const successValue: PatientModel[] = [
  {
    id: 'valid-id',
    displayId: 'dis',
    firstName: 'first-name',
    middleName: 'middle-name',
    lastName: 'last-name',
    sex: Gender.Male,
    dateOfBirth: new Date(),
    culturalName: 'cultural-name',
  },
];

const makeGetPatients = (): GetPatients => {
  class GetPatientsStub implements GetPatients {
    async get(): Promise<PatientModel[]> {
      return Promise.resolve(successValue);
    }
  }
  return new GetPatientsStub();
};

type makeSutProps = {
  getPatientsStub: GetPatients;
  sut: GetPatientsController;
};

const makeSut = (): makeSutProps => {
  const getPatientsStub = makeGetPatients();
  const sut = new GetPatientsController(getPatientsStub);
  return {
    getPatientsStub,
    sut,
  };
};

describe('GetPatient Controller', () => {
  it('should not return patients when internal db error is thrown', async () => {
    const { sut, getPatientsStub } = makeSut();
    jest.spyOn(getPatientsStub, 'get').mockImplementationOnce(() => {
      return new Promise((resolve, reject) => reject(new Error()));
    });
    const result = await sut.handle();
    expect(result).toMatchObject({ data: null, error: new Error() });
    expect(result.data).toBeFalsy();
    expect(result.error).toBeTruthy();
  });
  it('should return patients', async () => {
    const { sut } = makeSut();
    const result = await sut.handle();
    expect(result.data).toBeTruthy();
    expect(result.data).toEqual(successValue);
    expect(result.error).toBeFalsy();
  });
});
