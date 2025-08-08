import Config from 'react-native-config';

export const Branding = {
  Tamanu: 'tamanu',
} as const;

export type Branding = (typeof Branding)[keyof typeof Branding];

export const useBranding = (): Branding => {
  return (Config.BRANDING as Branding) || Branding.Tamanu;
};
