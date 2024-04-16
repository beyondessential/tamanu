import { getApplicationName } from 'react-native-device-info';

export enum Branding {
  Tamanu = 'tamanu',
  Cambodia = 'cambodia',
}

export const useBranding = (): Branding => {
  const appName = getApplicationName();
  if (appName === 'KhmEIR') return Branding.Cambodia;
  return Branding.Tamanu;
};
