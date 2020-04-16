import { HttpGetProgramsList } from '../../data/usecases/get-programs-list/http-get-programs-list';
import { GetProgramsController } from '../../presentation/controllers/programs/get-programs';
import { ProgramAxiosRepository } from '../../infra/httpClient/axios/program-repository/program';

export const makeGetProgramsController = (): GetProgramsController => {
  const programAxiosRepository = new ProgramAxiosRepository();
  const httpGetProgramsList = new HttpGetProgramsList(programAxiosRepository);
  const getProgramController = new GetProgramsController(httpGetProgramsList);
  return getProgramController;
};
