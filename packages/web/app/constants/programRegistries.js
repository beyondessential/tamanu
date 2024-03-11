import { REGISTRATION_STATUSES } from '@tamanu/constants';

// Please keep in sync with packages/mobile/App/constants/programRegistries.ts
export const PROGRAM_REGISTRATION_STATUS_LABEL = {
  [REGISTRATION_STATUSES.ACTIVE]: 'Active',
  [REGISTRATION_STATUSES.INACTIVE]: 'Removed',
  [REGISTRATION_STATUSES.RECORDED_IN_ERROR]: 'Delete',
};
