import { ID } from './ID';

export interface IUser {
  id: ID;
  displayId: string;
  email: string;
  localPassword?: string;
  displayName: string;
  role: string;
}
