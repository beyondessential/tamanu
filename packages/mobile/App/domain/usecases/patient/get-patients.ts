import { PatientModel } from "/root/App/ui/models/Patient";

export interface GetPatients {
  get(): Promise<PatientModel[]>;
}
