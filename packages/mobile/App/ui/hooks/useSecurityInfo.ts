import { useState, useEffect, useCallback } from 'react';
import { NativeModules } from 'react-native';
import { SETTING_KEYS } from '@tamanu/constants';
import {
  SecurityInfoModule,
  StorageEncryptionStatus,
  ENCRYPTION_STATUS,
} from '~/types/SecurityInfo';
import { useSettings } from '~/ui/contexts/SettingsContext';
import { useTranslation, GetTranslationFunction } from '~/ui/contexts/TranslationContext';
import { useAuth } from '~/ui/contexts/AuthContext';
import { useOnForeground } from '~/ui/hooks/useOnForeground';

interface SecurityComplianceProperties {
  isStorageCompliant: boolean;
  isPasscodeCompliant: boolean;
}

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

async function checkIsDeviceSecure(): Promise<boolean> {
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

function getSecurityIssues(
  getTranslation: GetTranslationFunction,
  { isStorageCompliant, isPasscodeCompliant }: SecurityComplianceProperties,
): string[] {
  const issues = [];
  if (!isStorageCompliant) {
    issues.push(
      getTranslation('general.device.security.issues.storage', 'Storage is not encrypted'),
    );
  }
  if (!isPasscodeCompliant) {
    issues.push(
      getTranslation('general.device.security.issues.passcode', 'No passcode is set'),
    );
  }
  return issues;
}

export const useSecurityInfo = () => {
  const [isStorageEncrypted, setIsStorageEncrypted] = useState<boolean>(true);
  const [isDeviceSecure, setIsDeviceSecure] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { getTranslation } = useTranslation();
  const { getSetting } = useSettings();
  const { signedIn } = useAuth();
  const isForeground = useOnForeground();

  const allowUnencryptedStorage = getSetting(SETTING_KEYS.SECURITY_MOBILE_ALLOW_UNENCRYPTED_STORAGE);
  const allowUnprotected = getSetting(SETTING_KEYS.SECURITY_MOBILE_ALLOW_UNPROTECTED);

  const fetchSecurityInfo = useCallback(async () => {
    setIsLoading(true);
    const storageEncryptionStatus = await getStorageEncryptionStatus();
    const isStorageEncryptedValue = checkIsStorageEncrypted(storageEncryptionStatus);
    const isDeviceSecureValue = await checkIsDeviceSecure();
    setIsStorageEncrypted(isStorageEncryptedValue);
    setIsDeviceSecure(isDeviceSecureValue);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (signedIn && isForeground) {
      fetchSecurityInfo();
    }
  }, [fetchSecurityInfo, signedIn, isForeground]);

  const isStorageCompliant = allowUnencryptedStorage ? true : isStorageEncrypted;
  const isPasscodeCompliant = allowUnprotected ? true : isDeviceSecure;
  return {
    securityIssues: getSecurityIssues(getTranslation, { isStorageCompliant, isPasscodeCompliant }),
    isLoading,
    fetchSecurityInfo,
  };
};
