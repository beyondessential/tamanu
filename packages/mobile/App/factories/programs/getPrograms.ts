import { HttpGetProgramsList } from '/data/usecases/get-programs-list/http-get-programs-list';
import { GetProgramsController } from '/presentation/controllers/programs/get-programs';
import { ProgramAxiosRepository } from '/infra/httpClient/axios/program-repository/program';
import { Client } from '/infra/httpClient/http-client';
import { AxiosAdapter } from '/infra/httpClient/axios/adapter/axios-adapter';
import { API } from '/infra/httpClient/axios/helper/BaseAPI';

export const makeGetProgramsController = (): GetProgramsController => {
  const axiosDapater = new AxiosAdapter(API);
  const httpClient = new Client(axiosDapater);
  const programAxiosRepository = new ProgramAxiosRepository(httpClient);
  const httpGetProgramsList = new HttpGetProgramsList(programAxiosRepository);
  const getProgramController = new GetProgramsController(httpGetProgramsList);
  return getProgramController;
};
