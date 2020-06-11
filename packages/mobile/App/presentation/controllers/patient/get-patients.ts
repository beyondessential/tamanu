import {Controller} from '../../protocols';
import {GetPatients} from '/root/App/domain/usecases/patient/get-patients';
import { PatientModel } from '/root/App/ui/models/Patient';
import { Result } from '../../protocols/result';
import { resultSucess, resultWithError } from '../../helper/result';

export class GetPatientsController implements Controller {

  private readonly getPatients: GetPatients;

  constructor(getPatients: GetPatients) {
      this.getPatients = getPatients
  }

  async handle(): Promise<Result<PatientModel[]>> {
      try {
          const patients = await this.getPatients.get();
          return resultSucess(patients);          
      } catch (error) {
          return resultWithError(error)          
      }    
  }
}
