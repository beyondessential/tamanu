export const JWT_TOKEN_TYPES = {
  REFRESH: 'refresh',
  ACCESS: 'access',
};

export const SYSTEM_USER_UUID = '00000000-0000-0000-0000-000000000000';

export const CAN_ACCESS_ALL_FACILITIES = 'ALL';

export const DEVICE_REGISTRATION_QUOTA_EXCEEDED_ERROR = 'Device registration quota exceeded';

export const DEVICE_SCOPES = {
  SYNC_CLIENT: 'sync_client',
} as const;
export type DeviceScope = (typeof DEVICE_SCOPES)[keyof typeof DEVICE_SCOPES];

export const DEVICE_SCOPES_SUBJECT_TO_QUOTA: DeviceScope[] = [DEVICE_SCOPES.SYNC_CLIENT] as const;
