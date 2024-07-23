import React, { MemoExoticComponent, ReactElement } from 'react';
import { GbFlag } from './GbFlag';
import { KmFlag } from './KmFlag';
import { FjFlag } from './FjFlag';
import { IconWithSizeProps } from '~/ui/interfaces/WithSizeProps';

export enum LanguagesWithFlags {
  en = 'en',
  km = 'km',
  fj = 'fj',
}

const flagIcons: Record<
  LanguagesWithFlags,
  MemoExoticComponent<(props: IconWithSizeProps) => ReactElement>
> = {
  [LanguagesWithFlags.en]: GbFlag,
  [LanguagesWithFlags.km]: KmFlag,
  [LanguagesWithFlags.fj]: FjFlag,
};

interface FlagIconProps extends IconWithSizeProps {
  languageCode: LanguagesWithFlags;
}

export const FlagIcon = ({ languageCode, ...props }: FlagIconProps) => {
  const Flag = flagIcons[languageCode];

  if (!Flag) return null;

  return <Flag {...props} />;
};
