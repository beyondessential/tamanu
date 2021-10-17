import { ID } from './ID';

export interface IFacility {
  id: ID;
  code: string;
  name: string;
  division?: string;
  type?: string;
}
