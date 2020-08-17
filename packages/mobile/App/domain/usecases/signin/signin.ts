import { AuthToken } from '~/types';

export interface SignInUserModel {
  [key: string]: string;
  email: string;
  password: string;
}

export interface SignInUser {
  signin(signInData: SignInUserModel): Promise<AuthToken>;
}
