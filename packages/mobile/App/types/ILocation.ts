import type { VisibilityStatus } from '~/visibilityStatuses';
import type { ID } from './ID';
import type { IFacility } from './IFacility';

export interface ILocation {
  id: ID;
  code: string;
  name: string;
  facility?: IFacility;
  visibilityStatus: VisibilityStatus.Current;
}
