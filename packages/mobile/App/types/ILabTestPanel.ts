import type { VisibilityStatus } from '~/visibilityStatuses';
import type { ID } from './ID';
import type { ILabTestType } from './ILabTestType';

export interface ILabTestPanel {
  id: ID;

  code: string;
  name: string;
  visibilityStatus?: VisibilityStatus;

  labTestTypes?: ILabTestType[];
}
