import { PatientModel } from "/root/App/ui/models/Patient";

export interface GetPatientsRepository {
  getAll (): Promise<PatientModel[]>
}