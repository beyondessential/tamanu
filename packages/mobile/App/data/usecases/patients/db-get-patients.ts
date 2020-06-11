import { GetPatients } from "/root/App/domain/usecases/patient/get-patients";
import { GetPatientsRepository } from "../../protocols/patient/get-patient-repository";
import { PatientModel } from "/root/App/ui/models/Patient";


export class DbGetPatients implements GetPatients {
  private readonly getPatientsRepository: GetPatientsRepository;

  constructor(getPatientsRepository: GetPatientsRepository) {
    this.getPatientsRepository = getPatientsRepository;
  }

  async get(): Promise<PatientModel[]> {
    const patients = await this.getPatientsRepository.getAll();
    return patients;
  }
}
