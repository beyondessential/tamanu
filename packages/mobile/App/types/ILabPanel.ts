import { VisibilityStatus } from '~/visibilityStatuses';
import { ID } from './ID';
import { ILabTestType } from './ILabTestType';

export interface ILabPanel {
  id: ID;

  code: string;
  name: string;
  visibilityStatus?: VisibilityStatus;

  labTestTypes?: ILabTestType[];
}
