import { ID } from './ID';

export interface IUser {
  id: ID;
  displayId: string;
  email: string;
  password?: string;
  displayName: string;
  role: string;
}
