import { ID } from './ID';
import { IFacility } from './IFacility';

export interface ILocationGroup {
  id: ID;
  code: string;
  name: string;
  facility?: IFacility;
  visibilityStatus: string;
}
