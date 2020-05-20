import { Controller } from '../../protocols';
import { SignInUser, SignInUserModel } from '/domain/usecases/signin/signin';
import { AuthToken } from '/domain/models/AuthToken';
import { MissingParamError } from './errors/missing-param-error';
import { Result } from '../../protocols/result';
import { resultSucess, resultWithError } from '../../helper/result';
import { BadRequestError } from '/infra/httpClient/errors/bad-request-error';
import { InvalidCredentialsError } from './errors/invalid-credentials-error';
import { NotFoundError } from '/infra/httpClient/errors/not-found-error';
import { ServerRequestError } from '/infra/httpClient/errors/server-request-error';
import { GeneralServerError } from './errors/general-error';
import { RequestFailedError } from '/infra/httpClient/axios/errors/request-failed-error';

export class SignInController implements Controller {
  private readonly signInUser: SignInUser;

  constructor(signInUser: SignInUser) {
    this.signInUser = signInUser;
  }

  async handle(signInData: SignInUserModel): Promise<Result<AuthToken>> {
    try {
      const requiredParams = ['email', 'password'];      
      const missingField = requiredParams.find((field: string) => !signInData[field]);
      
      if (missingField) {
        return resultWithError(new MissingParamError(missingField));
      } 

      const token = await this.signInUser.signin(signInData);
      return resultSucess(token);
    } catch (error) {
      switch (error.constructor) {
        case BadRequestError:
          return resultWithError(new InvalidCredentialsError());
        case NotFoundError:
          return resultWithError(new InvalidCredentialsError());
        case RequestFailedError:
          return resultWithError(error);
        case ServerRequestError:
          return resultWithError(new GeneralServerError());
        default:
          return resultWithError(error);
      }
    }
  }
}
