import type { VisibilityStatus } from '~/visibilityStatuses';
import type { ID } from './ID';
import type { IProgramRegistry } from './IProgramRegistry';

export interface IProgramRegistryConditionCategory {
  id: ID;
  code: string;
  name: string;
  visibilityStatus?: VisibilityStatus;
  programRegistryId: ID;
  programRegistry: IProgramRegistry;
}
