import type { ID } from './ID';
import type { IFacility } from './IFacility';

export interface ILocationGroup {
  id: ID;
  code: string;
  name: string;
  facility?: IFacility;
  visibilityStatus: string;
}
