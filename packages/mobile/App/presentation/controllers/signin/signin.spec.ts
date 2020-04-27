import { SignInController } from './signin';
import { SignInUser, SignInUserModel } from '/domain/usecases/signin/signin';
import { AuthToken } from '/domain/models/AuthToken';
import { MissingParamError } from './errors/missing-param-error';
import { BadRequestError } from '/infra/httpClient/errors/bad-request-error';
import { InvalidCredentialsError } from './errors/invalid-credentials-error';
import { NotFoundError } from '/infra/httpClient/errors/not-found-error';
import { UserNotFoundError } from './errors/user-not-found';
import { ServerRequestError } from '/infra/httpClient/errors/server-request-error';
import { GeneralServerError } from './errors/general-error';

const makeSignInUser = (): SignInUser => {
  class SignInUserStub implements SignInUser {
    async signin(signInData: SignInUserModel): Promise<AuthToken> {
      const fakeAuthToken = 'valid_token';
      return new Promise(resolve => resolve(fakeAuthToken));
    }
  }
  return new SignInUserStub();
};

interface SutTypes {
  sut: SignInController;
  signInUserStub: SignInUser;
}

const makeSut = (): SutTypes => {
  const signInUserStub = makeSignInUser();
  const sut = new SignInController(signInUserStub);
  return {
    signInUserStub,
    sut,
  };
};

describe('Name of the group', () => {
  it('should return missing param error if no password is provided', async () => {
    const { sut } = makeSut();
    const signInData = {
      email: 'valid_email',
      password: '',
    };
    const result = await sut.handle(signInData);
    expect(result.error).toBeTruthy();
    expect(result.error).toBeInstanceOf(MissingParamError);
  });

  it('should return missing param error if no email is provided', async () => {
    const { sut } = makeSut();
    const signInData = {
      email: '',
      password: 'valid_password',
    };
    const result = await sut.handle(signInData);
    expect(result.error).toBeTruthy();
    expect(result.error).toBeInstanceOf(MissingParamError);
  });

  it('should return auth token when valid credentials are provided', async () => {
    const { sut } = makeSut();
    const signInData = {
      email: 'valid_email',
      password: 'valid_password',
    };
    const result = await sut.handle(signInData);
    expect(result.error).toBeFalsy();
    expect(result.data).toBe('valid_token');
  });

  it('Should return InvalidCredentialsError if http-client throws BadRequest', async () => {
    const { sut, signInUserStub } = makeSut();
    jest.spyOn(signInUserStub, 'signin').mockImplementationOnce(() => {
      return new Promise((resolve, reject) => reject(new BadRequestError()));
    });
    const signInData = {
      email: 'valid_email',
      password: 'valid_password',
    };
    const result = await sut.handle(signInData);
    expect(result.error).toBeTruthy();
    expect(result.error).toBeInstanceOf(InvalidCredentialsError);
  });

  it('Should return UserNotFoundError if http-client throws BadRequest', async () => {
    const { sut, signInUserStub } = makeSut();
    jest.spyOn(signInUserStub, 'signin').mockImplementationOnce(() => {
      return new Promise((resolve, reject) =>
        reject(new NotFoundError('user_not_found')),
      );
    });
    const signInData = {
      email: 'valid_email',
      password: 'valid_password',
    };
    const result = await sut.handle(signInData);
    expect(result.error).toBeTruthy();
    expect(result.error).toBeInstanceOf(UserNotFoundError);
  });

  it('Should return UserNotFoundError if http-client throws BadRequest', async () => {
    const { sut, signInUserStub } = makeSut();
    jest.spyOn(signInUserStub, 'signin').mockImplementationOnce(() => {
      return new Promise((resolve, reject) =>
        reject(new ServerRequestError('user_not_found')),
      );
    });
    const signInData = {
      email: 'valid_email',
      password: 'valid_password',
    };
    const result = await sut.handle(signInData);
    expect(result.error).toBeTruthy();
    expect(result.error).toBeInstanceOf(GeneralServerError);
  });
});
