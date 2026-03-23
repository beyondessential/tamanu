export const JWT_TOKEN_TYPES = {
  REFRESH: 'refresh',
  ACCESS: 'access',
  PATIENT_PORTAL_ACCESS: 'patient_portal_access',
  PATIENT_PORTAL_REFRESH: 'patient_portal_refresh',
};

// we hardcode this as we don't support multiple keys yet, but still want
// to produce the `kid` clain in JWTs so we can smoothly rotate in future
export const JWT_KEY_ALG = 'HS256';
export const JWT_KEY_ID = 'eacd2b78-b1ee-4d68-87eb-b2c039d7d18a';

export const SYSTEM_USER_UUID = '00000000-0000-0000-0000-000000000000';

/** Stable UUID for the test patient */
export const TEST_PATIENT_ID = 'h1627394-3778-4c31-a510-9fcb88efdbf3';

export const ADMIN_USER_EMAIL = 'admin@tamanu.io';

export const CAN_ACCESS_ALL_FACILITIES = 'ALL';

// When adding more scopes here, you need to consider:
// - this is an early feature and we don't have all the corner cases worked out
// - currently devices that don't have a scope in database, and request it, get kicked out
// - so if you add a scope here, and then add it to the client side, locally that might
//   work fine, but then in production you might be accidentally creating something that
//   kicks out every single already logged in device that now requests that scope
//
// So it's kinda on you to figure out the new behaviour and its edge cases, and eventually
// we'll all work together to figure this thing out! 🤞
export const DEVICE_SCOPES = {
  SYNC_CLIENT: 'sync_client',
} as const;
export type DeviceScope = (typeof DEVICE_SCOPES)[keyof typeof DEVICE_SCOPES];

export const DEVICE_SCOPES_SUBJECT_TO_QUOTA: DeviceScope[] = [DEVICE_SCOPES.SYNC_CLIENT] as const;

export const DEVICE_REGISTRATION_PERMISSION = {
  NONE: 'none',
  SINGLE: 'single',
  UNLIMITED: 'unlimited',
} as const;
export type DeviceRegistrationPermission =
  (typeof DEVICE_REGISTRATION_PERMISSION)[keyof typeof DEVICE_REGISTRATION_PERMISSION];

export const LOGIN_ATTEMPT_OUTCOMES = {
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  LOCKED: 'locked',
};

export const LOCKED_OUT_ERROR_MESSAGE = 'User is locked out';
