import { ID } from './ID';

export interface IFacility {
  id: ID;
  code?: string;
  name?: string;
  streetAddress?: string;
  contactNumber?: string;
  email?: string;
  division?: string;
  type?: string;
}
