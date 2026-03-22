export interface StorageEncryptionStatus {
  status: number;
  statusText: 'UNSUPPORTED' | 'INACTIVE' | 'ACTIVATING' | 'ACTIVE' | 'ACTIVE_DEFAULT_KEY' | 'ACTIVE_PER_USER' | 'UNKNOWN';
}

export interface SecurityInfo {
  encryption: StorageEncryptionStatus;
  isDeviceSecure: boolean;
}

export interface SecurityInfoModule {
  /**
   * Gets the storage encryption status using DevicePolicyManager.getStorageEncryptionStatus()
   * @returns Promise<StorageEncryptionStatus> - Object containing status code and text description
   */
  getStorageEncryptionStatus(): Promise<StorageEncryptionStatus>;

  /**
   * Checks if the device is secure using KeyguardManager.isDeviceSecure()
   * @returns Promise<boolean> - Boolean indicating if device is secure
   */
  isDeviceSecure(): Promise<boolean>;
}

// Export constants for encryption status values
export const ENCRYPTION_STATUS = {
  UNSUPPORTED: 0,
  INACTIVE: 1,
  ACTIVATING: 2,
  ACTIVE: 3,
  ACTIVE_DEFAULT_KEY: 4,
  ACTIVE_PER_USER: 5,
  UNKNOWN: 6,
} as const;

export type EncryptionStatusValue = typeof ENCRYPTION_STATUS[keyof typeof ENCRYPTION_STATUS];
