import { Controller } from '../../protocols';
import { SignInUser, SignInUserModel } from '/domain/usecases/signin/signin';
import { AuthToken } from '/domain/models/AuthToken';
import { MissingParamError } from './errors/missing-param-error';
import { Result } from '../../protocols/result';
import { resultSucess, resultWithError } from '../../helper/result';
import { BadRequestError } from '/infra/httpClient/errors/bad-request-error';
import { InvalidCredentialsError } from './errors/invalid-credentials-error';
import { NotFoundError } from '/infra/httpClient/errors/not-found-error';
import { UserNotFoundError } from './errors/user-not-found';
import { ServerRequestError } from '/infra/httpClient/errors/server-request-error';
import { GeneralServerError } from './errors/general-error';

export class SignInController implements Controller {
  private readonly signInUser: SignInUser;

  constructor(signInUser: SignInUser) {
    this.signInUser = signInUser;
  }

  async handle(signInData: SignInUserModel): Promise<Result<AuthToken>> {
    try {
      const requiredParams = ['email', 'password'];
      let hasMissingParam;
      requiredParams.forEach(field => {
        if (!signInData[field]) {
          hasMissingParam = resultWithError(new MissingParamError('email'));
        }
      });

      if (hasMissingParam) {
        return hasMissingParam;
      }

      const token = await this.signInUser.signin(signInData);
      return resultSucess(token);
    } catch (error) {
      if (error instanceof BadRequestError)
        return resultWithError(new InvalidCredentialsError());
      if (error instanceof NotFoundError)
        return resultWithError(new UserNotFoundError(error.message));
      if (error instanceof ServerRequestError)
        return resultWithError(new GeneralServerError());
      return resultWithError(error);
    }
  }
}
