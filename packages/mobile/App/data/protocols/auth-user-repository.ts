import { AuthToken } from '../../domain/models/AuthToken';
import { SignInUserModel } from '../../domain/usecases/signin/signin';

export interface AuthUserRepository {
  auth(signInUserModel: SignInUserModel): Promise<AuthToken>;
}
