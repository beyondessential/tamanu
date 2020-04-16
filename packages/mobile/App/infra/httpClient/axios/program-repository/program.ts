import { GetProgramsRepository } from '/root/App/data/protocols/get-programs-repository';
import { ProgramModel } from '/root/App/domain/models/Program';
import { API } from '../helper/axios-helper';

export class ProgramAxiosRepository implements GetProgramsRepository {
  async get(): Promise<ProgramModel[]> {
    const response = await API.get('programs');
    return response.data;
  }
}
