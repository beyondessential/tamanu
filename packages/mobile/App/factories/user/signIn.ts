import { Client } from '/infra/httpClient/http-client';
import { AxiosAdapter } from '/infra/httpClient/axios/adapter/axios-adapter';
import { API } from '/infra/httpClient/axios/helper/BaseAPI';
import { UserAxiosRepository } from '../../infra/httpClient/axios/user-repository/user';
import { HttpSignInUser } from '/data/usecases/signin/http-sign-in-user';
import { SignInController } from '/presentation/controllers/signin/signin';

export const makeUserSignInController = (): SignInController => {
  const axiosAdapter = new AxiosAdapter(API);
  const httpClient = new Client(axiosAdapter);
  const userAxiosRepository = new UserAxiosRepository(httpClient);
  const httpSignInUser = new HttpSignInUser(userAxiosRepository);
  const signInController = new SignInController(httpSignInUser);
  return signInController;
};
