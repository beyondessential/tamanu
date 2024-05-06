import Config from 'react-native-config';

export enum Branding {
  Tamanu = 'tamanu',
  Cambodia = 'cambodia',
}

export const useBranding = (): Branding => {
  const appName = Config.BRANDING || Branding.Tamanu;
  if (appName === 'KhmEIR') return Branding.Cambodia;
  return Branding.Tamanu;
};
