import { GetProgramsRepository } from '/root/App/data/protocols/get-programs-repository';
import { ProgramModel } from '/root/App/domain/models/Program';
import { HttpClient } from '../../protocols/client';
import { RequestModel } from '../../protocols/request';

export class ProgramAxiosRepository implements GetProgramsRepository {
  httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async getAll(): Promise<ProgramModel[]> {
    const request: RequestModel = {
      method: `GET`,
      url: 'programs',
    };
    const response = await this.httpClient.makeRequest(request);
    return response.body;
  }
}
