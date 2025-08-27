import { useState, useEffect } from 'react';
import { NativeModules } from 'react-native';
import { SETTING_KEYS } from '@tamanu/constants';
import {
  SecurityInfoModule,
  StorageEncryptionStatus,
  DeviceSecurityStatus,
  ENCRYPTION_STATUS,
} from '~/types/SecurityInfo';
import { useSettings } from '~/ui/hooks/useSettings';

const SecurityInfoNativeModule: SecurityInfoModule = NativeModules.SecurityInfo;

async function getStorageEncryptionStatus(): Promise<StorageEncryptionStatus> {
  try {
    return await SecurityInfoNativeModule.getStorageEncryptionStatus();
  } catch (error) {
    console.warn('Failed to get storage encryption status:', error);
    return {
      status: 6,
      statusText: 'UNKNOWN',
    }
  }
}

async function checkIsDeviceSecure(): Promise<DeviceSecurityStatus> {
  try {
    return await SecurityInfoNativeModule.isDeviceSecure();
  } catch (error) {
    console.warn('Failed to check device security:', error);
    return false;
  }
}

// Statuses 0, 1, 2 are not encrypted, 4 is encrypted but less secure
// so we're only going to trust status 3 and 5.
function checkIsStorageEncrypted(status: StorageEncryptionStatus): boolean {
  return [
    ENCRYPTION_STATUS.ACTIVE,
    ENCRYPTION_STATUS.ACTIVE_PER_USER
  ].includes(status.status);
}

export const useSecurityInfo = () => {
  const [isStorageEncrypted, setIsStorageEncrypted] = useState<boolean>(false);
  const [isDeviceSecure, setIsDeviceSecure] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { getSetting } = useSettings();
  const allowUnencryptedStorage = getSetting(SETTING_KEYS.SECURITY_MOBILE_ALLOW_UNENCRYPTED_STORAGE);
  const allowUnprotected = getSetting(SETTING_KEYS.SECURITY_MOBILE_ALLOW_UNPROTECTED);

  useEffect(() => {
    const fetchSecurityInfo = async () => {
      const storageEncryptionStatus = await getStorageEncryptionStatus();
      const isStorageEncryptedValue = checkIsStorageEncrypted(storageEncryptionStatus);
      const isDeviceSecureValue = await checkIsDeviceSecure();
      setIsStorageEncrypted(isStorageEncryptedValue);
      setIsDeviceSecure(isDeviceSecureValue);
      setIsLoading(false);
    };

    fetchSecurityInfo();
  }, []);

  const isStorageCompliant = allowUnencryptedStorage ? true : isStorageEncrypted;
  const isPasscodeCompliant = allowUnprotected ? true : isDeviceSecure;
  return { isSecurityCompliant: isStorageCompliant && isPasscodeCompliant, isLoading };
};
