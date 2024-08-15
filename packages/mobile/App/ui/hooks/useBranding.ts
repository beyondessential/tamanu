import Config from 'react-native-config';

export enum Branding {
  Tamanu = 'tamanu',
}

export const useBranding = (): Branding => {
  return (Config.BRANDING as Branding) || Branding.Tamanu;
};
