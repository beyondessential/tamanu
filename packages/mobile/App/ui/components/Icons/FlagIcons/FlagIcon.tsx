import React from 'react';
import { GbFlag } from './GbFlag';
import { KmFlag } from './KmFlag';
import { FjFlag } from './FjFlag';

const flagIcons = {
  en: GbFlag,
  km: KmFlag,
  fj: FjFlag,
};

export const FlagIcon = ({ languageCode, ...props }) => {
  const Flag = flagIcons[languageCode];

  if (!Flag) return null;

  return <Flag {...props} />;
};
