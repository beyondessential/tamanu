import { GetPatientsRepository } from "/root/App/data/protocols/patient/get-patient-repository";
import { SqliteHelper } from '../helpers/sqlite-helper'
import { Patient } from "../entities/patient";
import { PatientModel } from "/root/App/ui/models/Patient";

export class PatientSqliteRepository implements GetPatientsRepository {
    async getAll(): Promise<PatientModel[]> {
        const patients = await SqliteHelper.client.getRepository(Patient).find();        
        return patients
    }
}