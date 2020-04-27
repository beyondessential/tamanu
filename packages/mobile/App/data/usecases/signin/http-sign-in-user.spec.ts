import { HttpSignInUser } from './http-sign-in-user';
import { AuthUserRepository } from '../../protocols/auth-user-repository';
import { AuthToken } from '/root/App/domain/models/AuthToken';
import { SignInUserModel } from '/root/App/domain/usecases/signin/signin';

const makeAddaccountRepository = (): AuthUserRepository => {
  class SignInUserRepositoryStub implements AuthUserRepository {
    async auth(signInUser: SignInUserModel): Promise<AuthToken> {
      return new Promise(resolve => resolve('valid_token'));
    }
  }
  return new SignInUserRepositoryStub();
};

interface SutTypes {
  sut: HttpSignInUser;
  signInUserRepository: AuthUserRepository;
}
const makeSut = (): SutTypes => {
  const signInUserRepository = makeAddaccountRepository();
  const sut = new HttpSignInUser(signInUserRepository);
  return {
    sut,
    signInUserRepository,
  };
};

describe('SignInUser Usecase', () => {
  it('should call authenticateUser method with correct values', async () => {
    const { sut, signInUserRepository } = makeSut();
    const signInSpy = jest.spyOn(signInUserRepository, 'auth');
    const credentials = {
      email: 'valid_email',
      password: 'valid_password',
    };
    await sut.signin(credentials);
    expect(signInSpy).toHaveBeenCalledWith(credentials);
  });

  it('should return token on success', async () => {
    const { sut } = makeSut();
    const credentials = {
      email: 'valid_email',
      password: 'valid_password',
    };
    const token = await sut.signin(credentials);
    expect(typeof token === 'string').toBe(true);
    expect(token).toEqual('valid_token');
  });
});
