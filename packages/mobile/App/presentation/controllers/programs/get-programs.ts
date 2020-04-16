import { Controller } from '../../protocols';
import { ProgramModel } from '/root/App/domain/models/Program';
import { GetProgramsList } from '/root/App/domain/usecases/programs/get-programs-list';

export class GetProgramsController implements Controller {
  private readonly getProgramsList: GetProgramsList;

  constructor(getProgramsList: GetProgramsList) {
    this.getProgramsList = getProgramsList;
  }

  async handle(): Promise<ProgramModel[]> {
    try {
      const programs = await this.getProgramsList.get();
      return programs;
    } catch (error) {
      return error;
    }
  }
}
