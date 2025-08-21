export const JWT_TOKEN_TYPES = {
  REFRESH: 'refresh',
  ACCESS: 'access',
};

export const SYSTEM_USER_UUID = '00000000-0000-0000-0000-000000000000';

export const CAN_ACCESS_ALL_FACILITIES = 'ALL';

export const DEVICE_REGISTRATION_QUOTA_EXCEEDED_ERROR = 'Device registration quota exceeded';

export const DEVICE_SCOPE = {
  SYNC_CLIENT: 'sync_client',
} as const;
export type DEVICE_SCOPE = (typeof DEVICE_SCOPE)[keyof typeof DEVICE_SCOPE];
