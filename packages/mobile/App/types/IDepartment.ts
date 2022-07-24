import { VisibilityStatus } from '~/visibilityStatuses';
import { ID } from './ID';
import { IFacility } from './IFacility';

export interface IDepartment {
  id: ID;
  code: string;
  name: string;
  facility?: IFacility;
  visibilityStatus: VisibilityStatus.Current,
}
