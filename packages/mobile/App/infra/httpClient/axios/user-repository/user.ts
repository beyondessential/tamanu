import { HttpClient } from '../../protocols/client';
import { RequestModel } from '../../protocols/request';
import { AuthUserRepository } from '/data/protocols/auth-user-repository';
import { AuthToken } from '/domain/models/AuthToken';
import { SignInUserModel } from '/domain/usecases/signin/signin';

export class UserAxiosRepository implements AuthUserRepository {
  httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async auth(signInCredentails: SignInUserModel): Promise<AuthToken> {
    const request: RequestModel = {
      method: `POST`,
      url: 'login',
      body: {
        email: signInCredentails.email,
        password: signInCredentails.password,
      },
    };
    const response = await this.httpClient.makeRequest(request);
    if (response.body instanceof Error) {
      throw response.body;
    }
    return response.body;
  }
}
