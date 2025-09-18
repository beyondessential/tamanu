export const DEVICE_TYPES = {
  CENTRAL_SERVER: 'central',
  FACILITY_SERVER: 'facility',
  MOBILE: 'mobile',
} as const;

export type DeviceType = (typeof DEVICE_TYPES)[keyof typeof DEVICE_TYPES];
