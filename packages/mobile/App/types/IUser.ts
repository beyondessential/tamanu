import { ID } from './ID';

export interface IUser {
  id: ID;
  email: string;
  localPassword?: string;
  displayName: string;
  role: string;
}
