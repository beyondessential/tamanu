import { GetProgramsRepository } from '../../protocols/get-programs-repository';
import { ProgramModel } from '/root/App/domain/models/Program';
import { GetProgramsList } from '/root/App/domain/usecases/programs/get-programs-list';

export class HttpGetProgramsList implements GetProgramsList {
  private readonly getProgramsRepository: GetProgramsRepository;

  constructor(getProgramsRepository: GetProgramsRepository) {
    this.getProgramsRepository = getProgramsRepository;
  }

  async get(): Promise<ProgramModel[]> {
    const programs = await this.getProgramsRepository.getAll();
    return programs;
  }
}
