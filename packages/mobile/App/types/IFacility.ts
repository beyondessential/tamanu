import { VisibilityStatus } from '~/visibilityStatuses';
import { ID } from './ID';

export interface IFacility {
  id: ID;
  code?: string;
  name?: string;
  contactNumber?: string;
  email?: string;
  streetAddress?: string;
  cityTown?: string;
  division?: string;
  type?: string;
  visibilityStatus: VisibilityStatus.Current,
}
