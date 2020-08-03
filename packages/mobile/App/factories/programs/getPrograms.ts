import { HttpGetProgramsList } from '/data/usecases/get-programs-list/http-get-programs-list';
import { GetProgramsController } from '/presentation/controllers/programs/get-programs';
import { ProgramAxiosRepository } from '/infra/httpClient/axios/program-repository/program';
import { Client } from '/infra/httpClient/http-client';
import { AxiosAdapter } from '/infra/httpClient/axios/adapter/axios-adapter';
import { API } from '/infra/httpClient/axios/helper/BaseAPI';

import { dummyPrograms } from '/root/App/dummyData/programs';

const dummyProgramRepository = {
  get: () => dummyPrograms,
};

export const makeGetProgramsController = (): GetProgramsController => {
  // const axiosAdapter = new AxiosAdapter(API);
  // const httpClient = new Client(axiosAdapter);
  // const programAxiosRepository = new ProgramAxiosRepository(httpClient);
  // const httpGetProgramsList = new HttpGetProgramsList(programAxiosRepository);
  const getProgramController = new GetProgramsController(dummyProgramRepository);
  return getProgramController;
};
