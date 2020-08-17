import { GetPatientsRepository } from "/root/App/data/protocols/patient/get-patient-repository";
import { SqliteHelper } from '../helpers/sqlite-helper'
import { PatientEntity } from "/root/App/entities/PatientEntity";
import { PatientModel } from "/root/App/models/PatientModel";

export class PatientSqliteRepository implements GetPatientsRepository {
    async getAll(): Promise<PatientModel[]> {
        const patients = await SqliteHelper.client.getRepository(PatientEntity).find();        
        return patients
    }
}
