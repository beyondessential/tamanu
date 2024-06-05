import Config from 'react-native-config';

export enum Branding {
  Tamanu = 'tamanu',
  Cambodia = 'cambodia',
}

export const useBranding = (): Branding => {
  return (Config.BRANDING as Branding) || Branding.Tamanu;
};
