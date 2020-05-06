import {
  SignInUser,
  SignInUserModel,
} from '/root/App/domain/usecases/signin/signin';
import { AuthToken } from '/root/App/domain/models/AuthToken';
import { AuthUserRepository } from '../../protocols/auth-user-repository';

export class HttpSignInUser implements SignInUser {
  private readonly signInUserRepository: AuthUserRepository;

  constructor(signInUserRepository: AuthUserRepository) {
    this.signInUserRepository = signInUserRepository;
  }

  async signin(signInUserModel: SignInUserModel): Promise<AuthToken> {
    const authToken = await this.signInUserRepository.auth(signInUserModel);
    return authToken;
  }
}
