import { VisibilityStatus } from '~/visibilityStatuses';
import { ID } from './ID';
import { IProgramRegistry } from './IProgramRegistry';

export interface IProgramRegistryCategory {
  id: ID;
  code: string;
  name: string;
  visibilityStatus?: VisibilityStatus;
  programRegistryId: ID;
  programRegistry: IProgramRegistry;
}
