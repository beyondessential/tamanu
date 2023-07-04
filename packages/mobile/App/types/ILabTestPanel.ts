import { VisibilityStatus } from '~/visibilityStatuses';
import { ID } from './ID';
import { ILabTestType } from './ILabTestType';

export interface ILabTestPanel {
  id: ID;

  code: string;
  name: string;
  visibilityStatus?: VisibilityStatus;

  labTestTypes?: ILabTestType[];
}
